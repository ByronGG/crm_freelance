import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ProposalTemplate } from '../../generated/prisma/client';
import { CreateProposalTemplateDto } from './dto/create-template.dto';
import { ProposalItemDto } from './dto/proposal-item.dto';

/**
 * Plantillas de propuesta reutilizables. Aisladas por ownerId. Precargan
 * ítems, moneda y notas al crear una propuesta (la carga la hace el cliente).
 */
@Injectable()
export class ProposalTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    ownerId: string,
    dto: CreateProposalTemplateDto,
  ): Promise<ProposalTemplate> {
    const items = dto.items ?? [];
    return this.prisma.proposalTemplate.create({
      data: {
        ownerId,
        name: dto.name,
        currency: dto.currency ?? 'USD',
        notes: dto.notes ?? null,
        items: { create: items.map((i) => this.toItemData(i)) },
      },
      include: { items: true },
    });
  }

  findAll(ownerId: string): Promise<ProposalTemplate[]> {
    return this.prisma.proposalTemplate.findMany({
      where: { ownerId },
      include: { items: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const template = await this.prisma.proposalTemplate.findFirst({
      where: { id, ownerId },
      include: { items: true },
    });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    return template;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Los ítems se borran en cascada (onDelete: Cascade).
    await this.prisma.proposalTemplate.delete({ where: { id } });
  }

  private toItemData(i: ProposalItemDto) {
    return {
      description: i.description,
      quantity: i.quantity ?? 1,
      unitPrice: i.unitPrice ?? 0,
    };
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.proposalTemplate.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Plantilla no encontrada');
    }
  }
}
