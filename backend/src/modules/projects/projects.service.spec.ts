import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from './projects.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ProjectsService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let deals: { assertOwned: jest.Mock };
  let service: ProjectsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    deals = { assertOwned: jest.fn() };
    service = new ProjectsService(
      asPrisma(prisma),
      deals as unknown as DealsService,
    );
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });

    it('filtra por el contacto de la oportunidad de origen (vista 360°)', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, { contactId: 'k1' });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: OWNER,
            deal: { contactId: 'k1' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException para un proyecto de otra cuenta', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER, 'pr1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('assertOwned', () => {
    it('acota por id + ownerId y no lanza cuando existe', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'pr1' });

      await expect(service.assertOwned(OWNER, 'pr1')).resolves.toBeUndefined();
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'pr1', ownerId: OWNER },
        select: { id: true },
      });
    });

    it('lanza NotFoundException para un proyecto de otra cuenta', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.assertOwned(OTHER, 'pr1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('aborta sin borrar si el proyecto no es de la cuenta', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 'pr1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });
});
