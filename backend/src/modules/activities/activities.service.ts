import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from '../projects/projects.service';
import { Activity } from '../../generated/prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

/**
 * Registro de actividades (notas, llamadas, correos, reuniones). Aislado por
 * ownerId. El contacto y la oportunidad asociados se validan vía sus servicios.
 */
@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly deals: DealsService,
    private readonly projects: ProjectsService,
  ) {}

  async create(ownerId: string, dto: CreateActivityDto): Promise<Activity> {
    await this.assertRelations(
      ownerId,
      dto.contactId,
      dto.dealId,
      dto.projectId,
    );
    return this.prisma.activity.create({
      data: {
        ownerId,
        type: dto.type ?? 'NOTE',
        content: dto.content,
        contactId: dto.contactId ?? null,
        dealId: dto.dealId ?? null,
        projectId: dto.projectId ?? null,
      },
    });
  }

  /**
   * Lista actividades, de la más reciente a la más antigua. Filtrada por
   * contacto sirve de timeline cronológica del contacto.
   */
  findAll(ownerId: string, query: QueryActivitiesDto): Promise<Activity[]> {
    const { type, contactId, dealId, projectId } = query;
    return this.prisma.activity.findMany({
      where: {
        ownerId,
        ...(type ? { type } : {}),
        ...(contactId ? { contactId } : {}),
        ...(dealId ? { dealId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findFirst({
      where: { id, ownerId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return activity;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<Activity> {
    await this.assertOwned(ownerId, id);
    await this.assertRelations(
      ownerId,
      dto.contactId,
      dto.dealId,
      dto.projectId,
    );
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
        ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    await this.prisma.activity.delete({ where: { id } });
  }

  private async assertRelations(
    ownerId: string,
    contactId?: string,
    dealId?: string,
    projectId?: string,
  ): Promise<void> {
    if (contactId) {
      await this.contacts.assertOwned(ownerId, contactId);
    }
    if (dealId) {
      await this.deals.assertOwned(ownerId, dealId);
    }
    if (projectId) {
      await this.projects.assertOwned(ownerId, projectId);
    }
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.activity.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Actividad no encontrada');
    }
  }
}
