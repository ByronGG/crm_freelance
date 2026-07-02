import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { CompaniesService } from './companies.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('CompaniesService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let service: CompaniesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CompaniesService(asPrisma(prisma));
  });

  describe('assertOwned', () => {
    it('no lanza cuando la empresa pertenece a la cuenta', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1' });

      await expect(service.assertOwned(OWNER, 'c1')).resolves.toBeUndefined();
      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: { id: 'c1', ownerId: OWNER },
        select: { id: true },
      });
    });

    it('lanza NotFoundException cuando la empresa es de otra cuenta', async () => {
      // El filtro por ownerId hace que findFirst devuelva null para un ajeno.
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.assertOwned(OTHER, 'c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.company.findMany.mockResolvedValue([]);

      await service.findAll(OWNER);

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('consulta acotada por id + ownerId y lanza si no existe para la cuenta', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OWNER, 'c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.company.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1', ownerId: OWNER },
        }),
      );
    });
  });

  describe('update / remove', () => {
    it('update aborta (NotFound) sin escribir si la empresa no es de la cuenta', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'c1', { name: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it('remove aborta (NotFound) sin borrar si la empresa no es de la cuenta', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 'c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });
  });
});
