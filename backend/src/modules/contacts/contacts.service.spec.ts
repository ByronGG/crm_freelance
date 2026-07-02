import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { CompaniesService } from './companies.service';
import { ContactsService } from './contacts.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ContactsService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let companies: { assertOwned: jest.Mock };
  let service: ContactsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    companies = { assertOwned: jest.fn() };
    service = new ContactsService(
      asPrisma(prisma),
      companies as unknown as CompaniesService,
    );
  });

  describe('create', () => {
    it('crea el contacto con el ownerId de la sesión', async () => {
      prisma.contact.create.mockResolvedValue({ id: 'k1' });

      await service.create(OWNER, { firstName: 'Ana' });

      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ firstName: 'Ana', ownerId: OWNER }),
      });
    });

    it('valida la empresa asociada por la misma cuenta (frontera de módulo)', async () => {
      prisma.contact.create.mockResolvedValue({ id: 'k1' });

      await service.create(OWNER, { firstName: 'Ana', companyId: 'co1' });

      expect(companies.assertOwned).toHaveBeenCalledWith(OWNER, 'co1');
    });

    it('no crea el contacto si la empresa es de otra cuenta', async () => {
      companies.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { firstName: 'Ana', companyId: 'ajena' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.contact.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.contact.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('acota por id + ownerId', async () => {
      prisma.contact.findFirst.mockResolvedValue({ id: 'k1', ownerId: OWNER });

      await service.findOne(OWNER, 'k1');

      expect(prisma.contact.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'k1', ownerId: OWNER } }),
      );
    });

    it('lanza NotFoundException para un contacto de otra cuenta', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER, 'k1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update / remove', () => {
    it('update aborta sin escribir si el contacto no es de la cuenta', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'k1', { firstName: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.contact.update).not.toHaveBeenCalled();
    });

    it('remove aborta sin borrar si el contacto no es de la cuenta', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 'k1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.contact.delete).not.toHaveBeenCalled();
    });
  });

  describe('assertOwned', () => {
    it('consulta acotada por id + ownerId y no lanza cuando existe', async () => {
      prisma.contact.findFirst.mockResolvedValue({ id: 'k1' });

      await expect(service.assertOwned(OWNER, 'k1')).resolves.toBeUndefined();
      expect(prisma.contact.findFirst).toHaveBeenCalledWith({
        where: { id: 'k1', ownerId: OWNER },
        select: { id: true },
      });
    });

    it('lanza NotFoundException cuando el contacto es de otra cuenta', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.assertOwned(OTHER, 'k1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
