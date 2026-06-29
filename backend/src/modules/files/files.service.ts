import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from '../projects/projects.service';
import { Attachment, AttachableType } from '../../generated/prisma/client';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { QueryAttachmentsDto } from './dto/query-attachments.dto';

/**
 * Adjuntos asociados a contactos, oportunidades o proyectos. Aislado por
 * ownerId. Antes de adjuntar se valida que la entidad pertenezca a la cuenta,
 * vía el servicio dueño.
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly deals: DealsService,
    private readonly projects: ProjectsService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateAttachmentDto,
  ): Promise<Attachment> {
    await this.assertEntityOwned(ownerId, dto.entityType, dto.entityId);
    return this.prisma.attachment.create({ data: { ownerId, ...dto } });
  }

  findAll(
    ownerId: string,
    query: QueryAttachmentsDto,
  ): Promise<Attachment[]> {
    const { entityType, entityId } = query;
    return this.prisma.attachment.findMany({
      where: {
        ownerId,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string): Promise<Attachment> {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, ownerId },
    });
    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    return attachment;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOne(ownerId, id);
    await this.prisma.attachment.delete({ where: { id } });
  }

  /** Valida que la entidad a la que se adjunta sea de la cuenta. */
  private async assertEntityOwned(
    ownerId: string,
    entityType: AttachableType,
    entityId: string,
  ): Promise<void> {
    if (entityType === 'CONTACT') {
      await this.contacts.assertOwned(ownerId, entityId);
    } else if (entityType === 'DEAL') {
      await this.deals.assertOwned(ownerId, entityId);
    } else {
      await this.projects.assertOwned(ownerId, entityId);
    }
  }
}
