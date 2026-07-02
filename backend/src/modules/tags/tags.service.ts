import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { Tag, TaggableType } from '../../generated/prisma/client';
import { ApplyTagDto } from './dto/apply-tag.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

/**
 * Etiquetas reutilizables y su aplicación a contactos u oportunidades.
 * Aislado por ownerId. Antes de etiquetar una entidad se valida que pertenezca
 * a la cuenta, vía el servicio dueño (contacts o deals).
 */
@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly deals: DealsService,
  ) {}

  async create(ownerId: string, dto: CreateTagDto): Promise<Tag> {
    try {
      return await this.prisma.tag.create({ data: { ownerId, ...dto } });
    } catch (e) {
      if (this.isUniqueError(e)) {
        throw new ConflictException('Ya existe una etiqueta con ese nombre');
      }
      throw e;
    }
  }

  findAll(ownerId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateTagDto): Promise<Tag> {
    await this.assertOwned(ownerId, id);
    try {
      return await this.prisma.tag.update({ where: { id }, data: dto });
    } catch (e) {
      if (this.isUniqueError(e)) {
        throw new ConflictException('Ya existe una etiqueta con ese nombre');
      }
      throw e;
    }
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Las aplicaciones (Taggable) se borran en cascada.
    await this.prisma.tag.delete({ where: { id } });
  }

  /** Aplica la etiqueta a un contacto u oportunidad (idempotente). */
  async apply(ownerId: string, tagId: string, dto: ApplyTagDto): Promise<void> {
    await this.assertOwned(ownerId, tagId);
    await this.assertEntityOwned(ownerId, dto.entityType, dto.entityId);
    try {
      await this.prisma.taggable.create({
        data: { tagId, entityType: dto.entityType, entityId: dto.entityId },
      });
    } catch (e) {
      // Ya estaba aplicada: lo tratamos como éxito (idempotente).
      if (!this.isUniqueError(e)) throw e;
    }
  }

  /** Quita la etiqueta de la entidad. */
  async unapply(
    ownerId: string,
    tagId: string,
    dto: ApplyTagDto,
  ): Promise<void> {
    await this.assertOwned(ownerId, tagId);
    await this.prisma.taggable.deleteMany({
      where: { tagId, entityType: dto.entityType, entityId: dto.entityId },
    });
  }

  /** Etiquetas aplicadas a una entidad concreta. */
  async listForEntity(
    ownerId: string,
    entityType: TaggableType,
    entityId: string,
  ): Promise<Tag[]> {
    const taggables = await this.prisma.taggable.findMany({
      where: { entityType, entityId, tag: { ownerId } },
      include: { tag: true },
    });
    return taggables.map((t) => t.tag);
  }

  /**
   * Etiquetas de varias entidades a la vez (para chips en listados sin N+1).
   * Devuelve pares entityId→tag; el cliente los agrupa como necesite.
   */
  async listForEntities(
    ownerId: string,
    entityType: TaggableType,
    entityIds: string[],
  ): Promise<{ entityId: string; tag: Tag }[]> {
    if (entityIds.length === 0) return [];
    const taggables = await this.prisma.taggable.findMany({
      where: { entityType, entityId: { in: entityIds }, tag: { ownerId } },
      include: { tag: true },
    });
    return taggables.map((t) => ({ entityId: t.entityId, tag: t.tag }));
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.tag.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Etiqueta no encontrada');
    }
  }

  /** Valida que la entidad a etiquetar sea de la cuenta, vía su servicio. */
  private async assertEntityOwned(
    ownerId: string,
    entityType: TaggableType,
    entityId: string,
  ): Promise<void> {
    if (entityType === 'CONTACT') {
      await this.contacts.assertOwned(ownerId, entityId);
    } else {
      await this.deals.assertOwned(ownerId, entityId);
    }
  }

  private isUniqueError(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    );
  }
}
