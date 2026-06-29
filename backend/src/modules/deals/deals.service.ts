import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { Deal, DealStage } from '../../generated/prisma/client';
import { ChangeStageDto } from './dto/change-stage.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { QueryDealsDto } from './dto/query-deals.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

// Orden de las columnas del Kanban (de izquierda a derecha).
const STAGE_ORDER: DealStage[] = [
  'NEW',
  'CONTACTED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

/**
 * Gestión de oportunidades (pipeline de ventas). Aislada por ownerId.
 * El contacto asociado se valida a través de ContactsService, nunca tocando
 * la tabla Contact directamente.
 */
@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
  ) {}

  async create(ownerId: string, dto: CreateDealDto): Promise<Deal> {
    if (dto.contactId) {
      await this.contacts.assertOwned(ownerId, dto.contactId);
    }
    const stage = dto.stage ?? 'NEW';

    // Crea la oportunidad y registra la entrada inicial del historial.
    return this.prisma.deal.create({
      data: {
        ownerId,
        title: dto.title,
        value: dto.value ?? 0,
        stage,
        expectedClose: dto.expectedClose ? new Date(dto.expectedClose) : null,
        contactId: dto.contactId ?? null,
        stageHistory: { create: { fromStage: null, toStage: stage } },
      },
    });
  }

  findAll(ownerId: string, query: QueryDealsDto): Promise<Deal[]> {
    const { stage, contactId, search } = query;
    return this.prisma.deal.findMany({
      where: {
        ownerId,
        ...(stage ? { stage } : {}),
        ...(contactId ? { contactId } : {}),
        ...(search
          ? { title: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      include: { contact: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Tablero Kanban: oportunidades agrupadas por etapa, con conteo y valor
   * total de cada columna. Las columnas salen en el orden del pipeline.
   */
  async board(ownerId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { ownerId },
      include: { contact: true },
      orderBy: { updatedAt: 'desc' },
    });

    return STAGE_ORDER.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const totalValue = stageDeals.reduce(
        (sum, d) => sum + Number(d.value),
        0,
      );
      return { stage, count: stageDeals.length, totalValue, deals: stageDeals };
    });
  }

  /**
   * Resumen del pipeline para dashboard/reports: oportunidades abiertas y su
   * valor, ganadas/perdidas, tasa de conversión y desglose por etapa. Es la
   * lectura pública del módulo deals; los módulos de solo lectura la consumen.
   */
  async getPipelineSummary(ownerId: string) {
    const grouped = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { ownerId },
      _count: { _all: true },
      _sum: { value: true },
    });

    const open: DealStage[] = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION'];
    let openCount = 0;
    let openValue = 0;
    let wonCount = 0;
    let lostCount = 0;

    const byStage = STAGE_ORDER.map((stage) => {
      const g = grouped.find((x) => x.stage === stage);
      const count = g?._count._all ?? 0;
      const value = Number(g?._sum.value ?? 0);
      if (open.includes(stage)) {
        openCount += count;
        openValue += value;
      }
      if (stage === 'WON') wonCount = count;
      if (stage === 'LOST') lostCount = count;
      return { stage, count, value: Math.round(value * 100) / 100 };
    });

    const closed = wonCount + lostCount;
    const conversionRate = closed > 0 ? Math.round((wonCount / closed) * 1000) / 1000 : 0;

    return {
      openCount,
      openValue: Math.round(openValue * 100) / 100,
      wonCount,
      lostCount,
      conversionRate,
      byStage,
    };
  }

  /** Detalle de la oportunidad: contacto + historial de cambios de etapa. */
  async findOne(ownerId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, ownerId },
      include: {
        contact: true,
        stageHistory: { orderBy: { changedAt: 'asc' } },
      },
    });
    if (!deal) {
      throw new NotFoundException('Oportunidad no encontrada');
    }
    return deal;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateDealDto,
  ): Promise<Deal> {
    await this.assertOwned(ownerId, id);
    if (dto.contactId) {
      await this.contacts.assertOwned(ownerId, dto.contactId);
    }
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
        ...(dto.expectedClose !== undefined
          ? { expectedClose: new Date(dto.expectedClose) }
          : {}),
      },
    });
  }

  /**
   * Cambia la etapa de la oportunidad y deja constancia en el historial.
   * Si la etapa nueva es LOST se conserva el motivo; en cualquier otra se
   * limpia. Si la etapa no cambia, no genera entrada de historial.
   */
  async changeStage(
    ownerId: string,
    id: string,
    dto: ChangeStageDto,
  ): Promise<Deal> {
    const current = await this.prisma.deal.findFirst({
      where: { id, ownerId },
      select: { stage: true },
    });
    if (!current) {
      throw new NotFoundException('Oportunidad no encontrada');
    }

    const lostReason = dto.stage === 'LOST' ? (dto.lostReason ?? null) : null;

    if (current.stage === dto.stage) {
      // Misma etapa: solo actualiza el motivo si aplica, sin historial.
      return this.prisma.deal.update({
        where: { id },
        data: { lostReason },
      });
    }

    // Transacción: registra el cambio y actualiza la etapa de forma atómica.
    const [, deal] = await this.prisma.$transaction([
      this.prisma.dealStageHistory.create({
        data: { dealId: id, fromStage: current.stage, toStage: dto.stage },
      }),
      this.prisma.deal.update({
        where: { id },
        data: { stage: dto.stage, lostReason },
      }),
    ]);
    return deal;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // El historial se borra en cascada (onDelete: Cascade).
    await this.prisma.deal.delete({ where: { id } });
  }

  /**
   * Verifica que la oportunidad exista y pertenezca a la cuenta. Público para
   * que otros módulos (proposals, projects…) validen el dealId que reciben.
   */
  async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.deal.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Oportunidad no encontrada');
    }
  }
}
