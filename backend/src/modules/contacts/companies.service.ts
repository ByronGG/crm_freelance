import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../../generated/prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

/**
 * Gestión de empresas. Toda consulta se filtra por ownerId para aislar los
 * datos de cada cuenta: un usuario nunca ve ni toca empresas de otro.
 */
@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({ data: { ...dto, ownerId } });
  }

  findAll(ownerId: string, search?: string): Promise<Company[]> {
    return this.prisma.company.findMany({
      where: {
        ownerId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Detalle de una empresa con sus contactos. */
  async findOne(ownerId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, ownerId },
      include: { contacts: { orderBy: { firstName: 'asc' } } },
    });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return company;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    await this.assertOwned(ownerId, id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Al borrar la empresa, los contactos quedan sin empresa (onDelete: SetNull).
    await this.prisma.company.delete({ where: { id } });
  }

  /**
   * Verifica que la empresa exista y pertenezca a la cuenta. Lo usa también
   * ContactsService para validar el companyId que recibe.
   */
  async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.company.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Empresa no encontrada');
    }
  }
}
