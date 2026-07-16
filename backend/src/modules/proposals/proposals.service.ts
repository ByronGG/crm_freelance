import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from '../projects/projects.service';
import { SettingsService } from '../settings/settings.service';
import { Project, Proposal } from '../../generated/prisma/client';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalItemDto } from './dto/proposal-item.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';
import { UpdateItemsDto } from './dto/update-items.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { buildProposalPdf } from './proposal-pdf';

/**
 * Gestión de propuestas. Aislada por ownerId. El total NUNCA se recibe del
 * cliente: se calcula a partir de los ítems (cantidad × precio). El contacto y
 * la oportunidad asociados se validan vía sus servicios, no sus tablas.
 */
@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly deals: DealsService,
    private readonly settings: SettingsService,
    private readonly projects: ProjectsService,
  ) {}

  async create(ownerId: string, dto: CreateProposalDto): Promise<Proposal> {
    await this.assertRelations(ownerId, dto.contactId, dto.dealId);
    const items = dto.items ?? [];

    return this.prisma.proposal.create({
      data: {
        ownerId,
        title: dto.title,
        currency: dto.currency ?? 'USD',
        notes: dto.notes ?? null,
        contactId: dto.contactId,
        dealId: dto.dealId ?? null,
        total: this.computeTotal(items),
        items: { create: items.map((i) => this.toItemData(i)) },
      },
      include: { items: true },
    });
  }

  /**
   * Convierte una propuesta ACEPTADA en un proyecto para su cliente (flujo
   * Cliente → Propuesta → Proyecto). El proyecto hereda el título y las notas y
   * queda enlazado a la propuesta (1:1). Delega la creación en ProjectsService.
   */
  async convertToProject(ownerId: string, id: string): Promise<Project> {
    const proposal = await this.findOne(ownerId, id);
    if (proposal.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Solo se puede convertir una propuesta aceptada',
      );
    }
    if (!proposal.contactId) {
      throw new BadRequestException('La propuesta no tiene cliente asignado');
    }
    return this.projects.createFromProposal(ownerId, {
      proposalId: proposal.id,
      contactId: proposal.contactId,
      name: proposal.title,
      description: proposal.notes ?? undefined,
    });
  }

  findAll(ownerId: string, query: QueryProposalsDto): Promise<Proposal[]> {
    const { status, contactId, dealId, search } = query;
    return this.prisma.proposal.findMany({
      where: {
        ownerId,
        ...(status ? { status } : {}),
        ...(contactId ? { contactId } : {}),
        ...(dealId ? { dealId } : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { contact: true, deal: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Detalle de la propuesta: ítems, contacto y oportunidad. */
  async findOne(ownerId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, ownerId },
      include: { items: true, contact: true, deal: true },
    });
    if (!proposal) {
      throw new NotFoundException('Propuesta no encontrada');
    }
    return proposal;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateProposalDto,
  ): Promise<Proposal> {
    await this.assertOwned(ownerId, id);
    await this.assertRelations(ownerId, dto.contactId, dto.dealId);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
        ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
      },
      include: { items: true },
    });
  }

  /** Reemplaza todos los ítems y recalcula el total de forma atómica. */
  async replaceItems(
    ownerId: string,
    id: string,
    dto: UpdateItemsDto,
  ): Promise<Proposal> {
    await this.assertOwned(ownerId, id);
    const [, , proposal] = await this.prisma.$transaction([
      this.prisma.proposalItem.deleteMany({ where: { proposalId: id } }),
      this.prisma.proposalItem.createMany({
        data: dto.items.map((i) => ({ ...this.toItemData(i), proposalId: id })),
      }),
      this.prisma.proposal.update({
        where: { id },
        data: { total: this.computeTotal(dto.items) },
        include: { items: true },
      }),
    ]);
    return proposal;
  }

  /**
   * Cambia el estado. Al pasar a SENT por primera vez, registra sentAt.
   */
  async changeStatus(
    ownerId: string,
    id: string,
    dto: ChangeStatusDto,
  ): Promise<Proposal> {
    const current = await this.prisma.proposal.findFirst({
      where: { id, ownerId },
      select: { sentAt: true },
    });
    if (!current) {
      throw new NotFoundException('Propuesta no encontrada');
    }
    const markSent = dto.status === 'SENT' && !current.sentAt;
    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: dto.status,
        ...(markSent ? { sentAt: new Date() } : {}),
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Los ítems se borran en cascada (onDelete: Cascade).
    await this.prisma.proposal.delete({ where: { id } });
  }

  /**
   * Genera el PDF de la propuesta con sus ítems y los datos del perfil de
   * empresa (settings). findOne ya valida la propiedad.
   */
  async generatePdf(
    ownerId: string,
    id: string,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const proposal = await this.findOne(ownerId, id);
    const profile = await this.settings.getCompanyProfile(ownerId);
    const buffer = await buildProposalPdf(proposal, profile);
    const slug = proposal.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return { filename: `propuesta-${slug || 'sin-titulo'}.pdf`, buffer };
  }

  /**
   * Propuestas ENVIADAS cuyo envío es anterior a `before`, de TODAS las
   * cuentas. Uso exclusivo del job de seguimiento (ámbito sistema).
   */
  findStaleSent(before: Date): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: { status: 'SENT', sentAt: { not: null, lt: before } },
      orderBy: { sentAt: 'asc' },
    });
  }

  /** Total = Σ(cantidad × precio), redondeado a 2 decimales. */
  private computeTotal(items: ProposalItemDto[]): number {
    const total = items.reduce(
      (sum, i) => sum + (i.quantity ?? 1) * (i.unitPrice ?? 0),
      0,
    );
    return Math.round(total * 100) / 100;
  }

  private toItemData(i: ProposalItemDto) {
    return {
      description: i.description,
      quantity: i.quantity ?? 1,
      unitPrice: i.unitPrice ?? 0,
    };
  }

  /**
   * Valida que el contacto y la oportunidad referidos sean de la cuenta y sean
   * coherentes: si la oportunidad tiene contacto, debe ser el mismo cliente que
   * el de la propuesta (impide colgar la propuesta de un deal de otro cliente).
   */
  private async assertRelations(
    ownerId: string,
    contactId?: string,
    dealId?: string,
  ): Promise<void> {
    if (contactId) {
      await this.contacts.assertOwned(ownerId, contactId);
    }
    if (dealId) {
      const deal = await this.deals.findOne(ownerId, dealId);
      if (contactId && deal.contactId && deal.contactId !== contactId) {
        throw new BadRequestException(
          'La oportunidad pertenece a un cliente distinto al de la propuesta',
        );
      }
    }
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.proposal.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Propuesta no encontrada');
    }
  }
}
