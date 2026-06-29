import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { Task } from '../../generated/prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * Tareas de seguimiento con fecha de vencimiento y estado. Aislado por
 * ownerId. El contacto y la oportunidad asociados se validan vía sus servicios.
 */
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly deals: DealsService,
  ) {}

  async create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    await this.assertRelations(ownerId, dto.contactId, dto.dealId);
    return this.prisma.task.create({
      data: {
        ownerId,
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? 'PENDING',
        contactId: dto.contactId ?? null,
        dealId: dto.dealId ?? null,
      },
    });
  }

  /** Lista tareas ordenadas por vencimiento (las sin fecha, al final). */
  findAll(ownerId: string, query: QueryTasksDto): Promise<Task[]> {
    const { status, contactId, dealId, dueBefore } = query;
    return this.prisma.task.findMany({
      where: {
        ownerId,
        ...(status ? { status } : {}),
        ...(contactId ? { contactId } : {}),
        ...(dealId ? { dealId } : {}),
        ...(dueBefore ? { dueDate: { lte: new Date(dueBefore) } } : {}),
      },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    });
  }

  async findOne(ownerId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({ where: { id, ownerId } });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.assertOwned(ownerId, id);
    await this.assertRelations(ownerId, dto.contactId, dto.dealId);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
        ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  private async assertRelations(
    ownerId: string,
    contactId?: string,
    dealId?: string,
  ): Promise<void> {
    if (contactId) {
      await this.contacts.assertOwned(ownerId, contactId);
    }
    if (dealId) {
      await this.deals.assertOwned(ownerId, dealId);
    }
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.task.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Tarea no encontrada');
    }
  }
}
