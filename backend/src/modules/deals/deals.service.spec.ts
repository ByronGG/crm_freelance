import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from './deals.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('DealsService (aislamiento por ownerId y frontera de módulo)', () => {
  let prisma: PrismaMock;
  let contacts: { assertOwned: jest.Mock };
  let service: DealsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    contacts = { assertOwned: jest.fn() };
    service = new DealsService(
      asPrisma(prisma),
      contacts as unknown as ContactsService,
    );
  });

  describe('create', () => {
    it('crea la oportunidad con ownerId e historial inicial de etapa', async () => {
      prisma.deal.create.mockResolvedValue({ id: 'd1' });

      await service.create(OWNER, { title: 'Web' });

      expect(prisma.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownerId: OWNER,
          title: 'Web',
          stageHistory: { create: { fromStage: null, toStage: 'NEW' } },
        }),
      });
      // Sin contactId no se valida contacto ajeno.
      expect(contacts.assertOwned).not.toHaveBeenCalled();
    });

    it('valida el contacto asociado vía ContactsService (nunca su tabla)', async () => {
      prisma.deal.create.mockResolvedValue({ id: 'd1' });

      await service.create(OWNER, { title: 'Web', contactId: 'k1' });

      expect(contacts.assertOwned).toHaveBeenCalledWith(OWNER, 'k1');
    });

    it('no crea la oportunidad si el contacto es de otra cuenta', async () => {
      contacts.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { title: 'Web', contactId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.deal.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.deal.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('assertOwned', () => {
    it('acota por id + ownerId y no lanza cuando existe', async () => {
      prisma.deal.findFirst.mockResolvedValue({ id: 'd1' });

      await expect(service.assertOwned(OWNER, 'd1')).resolves.toBeUndefined();
      expect(prisma.deal.findFirst).toHaveBeenCalledWith({
        where: { id: 'd1', ownerId: OWNER },
        select: { id: true },
      });
    });

    it('lanza NotFoundException para una oportunidad de otra cuenta', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      await expect(service.assertOwned(OTHER, 'd1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('changeStage', () => {
    it('no modifica etapa ni historial si la oportunidad no es de la cuenta', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.changeStage(OTHER, 'd1', { stage: 'WON' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.deal.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('aborta sin escribir si la oportunidad no es de la cuenta', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'd1', { title: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });
});
