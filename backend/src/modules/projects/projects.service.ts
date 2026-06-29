import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { DealsService } from '../deals/deals.service';
import { Milestone, Project } from '../../generated/prisma/client';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

/**
 * Gestión de proyectos y sus hitos. Aislada por ownerId. La oportunidad de
 * origen se consulta a través de DealsService, nunca tocando su tabla.
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deals: DealsService,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    if (dto.dealId) {
      await this.deals.assertOwned(ownerId, dto.dealId);
      await this.assertDealNotLinked(dto.dealId);
    }
    return this.prisma.project.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? 'ACTIVE',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        dealId: dto.dealId ?? null,
      },
    });
  }

  /**
   * Convierte una oportunidad GANADA en un proyecto. Valida que la oportunidad
   * sea de la cuenta, esté en etapa WON y no tenga ya un proyecto. El proyecto
   * hereda el título de la oportunidad y arranca ACTIVE.
   */
  async createFromDeal(ownerId: string, dealId: string): Promise<Project> {
    const deal = await this.deals.findOne(ownerId, dealId);
    if (deal.stage !== 'WON') {
      throw new BadRequestException(
        'Solo se puede convertir una oportunidad en etapa Ganada',
      );
    }
    await this.assertDealNotLinked(dealId);
    return this.prisma.project.create({
      data: {
        ownerId,
        name: deal.title,
        status: 'ACTIVE',
        startDate: new Date(),
        dealId,
      },
    });
  }

  findAll(ownerId: string, query: QueryProjectsDto): Promise<Project[]> {
    const { status, search } = query;
    return this.prisma.project.findMany({
      where: {
        ownerId,
        ...(status ? { status } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { deal: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Detalle del proyecto: hitos y oportunidad de origen. */
  async findOne(ownerId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
      include: {
        deal: true,
        milestones: { orderBy: [{ dueDate: 'asc' }, { title: 'asc' }] },
      },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    await this.assertOwned(ownerId, id);
    if (dto.dealId) {
      await this.deals.assertOwned(ownerId, dto.dealId);
      await this.assertDealNotLinked(dto.dealId, id);
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: new Date(dto.startDate) }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: new Date(dto.endDate) }
          : {}),
        ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Los hitos se borran en cascada (onDelete: Cascade).
    await this.prisma.project.delete({ where: { id } });
  }

  // ───────────────────────────── hitos ─────────────────────────────

  async addMilestone(
    ownerId: string,
    projectId: string,
    dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    await this.assertOwned(ownerId, projectId);
    return this.prisma.milestone.create({
      data: {
        projectId,
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? 'PENDING',
      },
    });
  }

  async updateMilestone(
    ownerId: string,
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<Milestone> {
    await this.assertMilestoneOwned(ownerId, projectId, milestoneId);
    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async removeMilestone(
    ownerId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.assertMilestoneOwned(ownerId, projectId, milestoneId);
    await this.prisma.milestone.delete({ where: { id: milestoneId } });
  }

  // ───────────────────────────── helpers ─────────────────────────────

  /**
   * Verifica que el proyecto exista y pertenezca a la cuenta. Público para que
   * otros módulos (invoices) validen el projectId que reciben.
   */
  async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.project.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Proyecto no encontrado');
    }
  }

  /** Verifica que el hito exista dentro de un proyecto de la cuenta. */
  private async assertMilestoneOwned(
    ownerId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    const found = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId, project: { ownerId } },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Hito no encontrado');
    }
  }

  /** Una oportunidad solo puede tener un proyecto (dealId es @unique). */
  private async assertDealNotLinked(
    dealId: string,
    exceptProjectId?: string,
  ): Promise<void> {
    const existing = await this.prisma.project.findUnique({
      where: { dealId },
      select: { id: true },
    });
    if (existing && existing.id !== exceptProjectId) {
      throw new ConflictException('La oportunidad ya tiene un proyecto');
    }
  }
}
