import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Contact } from '../../generated/prisma/client';
import { CompaniesService } from './companies.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

/**
 * Gestión de contactos. Aislada por ownerId. Cuando un contacto referencia
 * una empresa, se valida que esa empresa pertenezca a la misma cuenta.
 */
@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
  ) {}

  async create(ownerId: string, dto: CreateContactDto): Promise<Contact> {
    if (dto.companyId) {
      await this.companies.assertOwned(ownerId, dto.companyId);
    }
    return this.prisma.contact.create({ data: { ...dto, ownerId } });
  }

  findAll(ownerId: string, query: QueryContactsDto): Promise<Contact[]> {
    const { search, companyId } = query;
    return this.prisma.contact.findMany({
      where: {
        ownerId,
        ...(companyId ? { companyId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { company: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  /**
   * Vista "360°" del contacto: sus datos + la empresa asociada.
   * Las oportunidades, actividades y proyectos se agregarán a través de los
   * servicios de sus módulos cuando existan (no se consultan sus tablas aquí).
   */
  async findOne(ownerId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, ownerId },
      include: { company: true },
    });
    if (!contact) {
      throw new NotFoundException('Contacto no encontrado');
    }
    return contact;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateContactDto,
  ): Promise<Contact> {
    await this.assertOwned(ownerId, id);
    if (dto.companyId) {
      await this.companies.assertOwned(ownerId, dto.companyId);
    }
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    await this.prisma.contact.delete({ where: { id } });
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.contact.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Contacto no encontrado');
    }
  }
}
