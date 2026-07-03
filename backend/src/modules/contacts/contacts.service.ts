import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { parseCsv, toCsv } from '../../common/csv.util';
import { Contact } from '../../generated/prisma/client';
import { CompaniesService } from './companies.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

// Cabecera del CSV (orden de columnas al exportar). Al importar se aceptan
// también los alias en español de la fila de cabecera.
const CSV_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'position',
  'company',
  'notes',
] as const;

const CSV_ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  nombre: 'firstName',
  apellido: 'lastName',
  apellidos: 'lastName',
  correo: 'email',
  'e-mail': 'email',
  telefono: 'phone',
  teléfono: 'phone',
  cargo: 'position',
  puesto: 'position',
  empresa: 'company',
  compañia: 'company',
  notas: 'notes',
};

// Nombre de columna en minúsculas → clave canónica (para casar la cabecera
// sin depender de mayúsculas: "firstName", "FirstName" o "firstname").
const CSV_HEADER_KEYS: Record<string, (typeof CSV_COLUMNS)[number]> = {
  ...Object.fromEntries(CSV_COLUMNS.map((c) => [c.toLowerCase(), c])),
  ...CSV_ALIASES,
};

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

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

  /** Exporta los contactos de la cuenta como texto CSV (con cabecera). */
  async exportCsv(ownerId: string): Promise<string> {
    const contacts = await this.prisma.contact.findMany({
      where: { ownerId },
      include: { company: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const rows: string[][] = [[...CSV_COLUMNS]];
    for (const c of contacts) {
      rows.push([
        c.firstName,
        c.lastName ?? '',
        c.email ?? '',
        c.phone ?? '',
        c.position ?? '',
        c.company?.name ?? '',
        c.notes ?? '',
      ]);
    }
    return toCsv(rows);
  }

  /**
   * Importa contactos desde CSV. La primera fila es la cabecera (nombres en
   * inglés o sus alias en español). Crea la empresa si el nombre no existe.
   * Devuelve cuántos se crearon, cuántos se omitieron y los errores por fila.
   */
  async importCsv(ownerId: string, csv: string): Promise<ImportResult> {
    const rows = parseCsv(csv).filter((r) => r.some((c) => c.trim() !== ''));
    if (rows.length < 2) {
      return {
        created: 0,
        skipped: 0,
        errors: ['El CSV no tiene filas de datos'],
      };
    }

    // Mapea la cabecera a índices de columna conocidos (sin distinguir mayúsc.).
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const index: Partial<Record<(typeof CSV_COLUMNS)[number], number>> = {};
    header.forEach((name, i) => {
      const key = CSV_HEADER_KEYS[name];
      if (key) index[key] = i;
    });

    if (index.firstName === undefined) {
      return {
        created: 0,
        skipped: 0,
        errors: ['Falta la columna obligatoria "firstName" (o "nombre")'],
      };
    }

    // Cachea las empresas de la cuenta por nombre (para find-or-create).
    const companies = await this.companies.findAll(ownerId);
    const companyByName = new Map<string, string>();
    for (const co of companies) {
      companyByName.set(co.name.trim().toLowerCase(), co.id);
    }

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    const cell = (row: string[], key: (typeof CSV_COLUMNS)[number]) => {
      const i = index[key];
      return i !== undefined ? (row[i] ?? '').trim() : '';
    };

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const firstName = cell(row, 'firstName');
      if (!firstName) {
        result.skipped++;
        result.errors.push(`Fila ${r + 1}: sin nombre, omitida`);
        continue;
      }

      try {
        const companyName = cell(row, 'company');
        let companyId: string | undefined;
        if (companyName) {
          const found = companyByName.get(companyName.toLowerCase());
          if (found) {
            companyId = found;
          } else {
            const created = await this.companies.create(ownerId, {
              name: companyName,
            });
            companyByName.set(companyName.toLowerCase(), created.id);
            companyId = created.id;
          }
        }

        await this.prisma.contact.create({
          data: {
            ownerId,
            firstName,
            lastName: cell(row, 'lastName') || null,
            email: cell(row, 'email') || null,
            phone: cell(row, 'phone') || null,
            position: cell(row, 'position') || null,
            notes: cell(row, 'notes') || null,
            companyId: companyId ?? null,
          },
        });
        result.created++;
      } catch {
        result.skipped++;
        result.errors.push(`Fila ${r + 1}: no se pudo importar`);
      }
    }

    return result;
  }

  /**
   * Verifica que el contacto exista y pertenezca a la cuenta. Público para que
   * otros módulos (deals, proposals…) validen el contactId que reciben.
   */
  async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.contact.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Contacto no encontrado');
    }
  }
}
