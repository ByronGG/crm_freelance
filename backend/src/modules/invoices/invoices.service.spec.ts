import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ProjectsService } from '../projects/projects.service';
import { SettingsService } from '../settings/settings.service';
import { InvoicesService } from './invoices.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('InvoicesService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let projects: { getContactId: jest.Mock };
  let service: InvoicesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    projects = { getContactId: jest.fn() };
    service = new InvoicesService(
      asPrisma(prisma),
      projects as unknown as ProjectsService,
      {} as unknown as SettingsService,
    );
  });

  describe('create', () => {
    it('deriva el cliente del proyecto y lo fija en la factura', async () => {
      projects.getContactId.mockResolvedValue('k1');
      prisma.invoice.count.mockResolvedValue(0);
      prisma.invoice.create.mockResolvedValue({ id: 'i1' });

      await service.create(OWNER, { projectId: 'pr1', total: 100 });

      expect(projects.getContactId).toHaveBeenCalledWith(OWNER, 'pr1');
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: OWNER,
            projectId: 'pr1',
            contactId: 'k1',
          }),
        }),
      );
    });

    it('no crea la factura si el proyecto es de otra cuenta', async () => {
      projects.getContactId.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { projectId: 'ajeno', total: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('findOne / update', () => {
    it('findOne lanza NotFoundException para una factura de otra cuenta', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER, 'i1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('update aborta sin escribir si la factura no es de la cuenta', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'i1', { total: 999 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('markOverdue (ámbito sistema)', () => {
    it('busca EMITIDAS vencidas sin filtrar por cuenta y las marca OVERDUE', async () => {
      const now = new Date('2026-06-01');
      prisma.invoice.findMany.mockResolvedValue([{ id: 'i1' }, { id: 'i2' }]);

      const result = await service.markOverdue(now);

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ISSUED', dueDate: { not: null, lt: now } },
        }),
      );
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['i1', 'i2'] } },
        data: { status: 'OVERDUE' },
      });
      expect(result).toHaveLength(2);
    });

    it('no actualiza nada si no hay facturas vencidas', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      await service.markOverdue(new Date());

      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    });
  });
});
