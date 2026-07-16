import { BadRequestException, NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from '../projects/projects.service';
import { SettingsService } from '../settings/settings.service';
import { ProposalsService } from './proposals.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ProposalsService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let contacts: { assertOwned: jest.Mock };
  let deals: { findOne: jest.Mock };
  let projects: { createFromProposal: jest.Mock };
  let service: ProposalsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    contacts = { assertOwned: jest.fn() };
    deals = { findOne: jest.fn() };
    projects = { createFromProposal: jest.fn() };
    service = new ProposalsService(
      asPrisma(prisma),
      contacts as unknown as ContactsService,
      deals as unknown as DealsService,
      {} as unknown as SettingsService,
      projects as unknown as ProjectsService,
    );
  });

  describe('create', () => {
    it('calcula el total desde los ítems (nunca lo recibe del cliente)', async () => {
      prisma.proposal.create.mockResolvedValue({ id: 'p1' });

      await service.create(OWNER, {
        title: 'Web',
        contactId: 'k1',
        items: [
          { description: 'Diseño', quantity: 2, unitPrice: 100 },
          { description: 'Hosting', quantity: 1, unitPrice: 50 },
        ],
      });

      expect(prisma.proposal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: OWNER, total: 250 }),
        }),
      );
    });

    it('valida contacto y oportunidad asociados vía sus servicios', async () => {
      prisma.proposal.create.mockResolvedValue({ id: 'p1' });
      deals.findOne.mockResolvedValue({ id: 'd1', contactId: 'k1' });

      await service.create(OWNER, {
        title: 'Web',
        contactId: 'k1',
        dealId: 'd1',
      });

      expect(contacts.assertOwned).toHaveBeenCalledWith(OWNER, 'k1');
      expect(deals.findOne).toHaveBeenCalledWith(OWNER, 'd1');
    });

    it('rechaza si la oportunidad pertenece a otro cliente', async () => {
      deals.findOne.mockResolvedValue({ id: 'd1', contactId: 'otro' });

      await expect(
        service.create(OWNER, { title: 'Web', contactId: 'k1', dealId: 'd1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.proposal.create).not.toHaveBeenCalled();
    });

    it('no crea la propuesta si el contacto es de otra cuenta', async () => {
      contacts.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { title: 'Web', contactId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.proposal.create).not.toHaveBeenCalled();
    });
  });

  describe('convertToProject', () => {
    it('convierte una propuesta ACEPTADA delegando en projects.createFromProposal', async () => {
      prisma.proposal.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'ACCEPTED',
        contactId: 'k1',
        title: 'Web',
        notes: 'detalle',
      });
      projects.createFromProposal.mockResolvedValue({ id: 'pr1' });

      await service.convertToProject(OWNER, 'p1');

      expect(projects.createFromProposal).toHaveBeenCalledWith(OWNER, {
        proposalId: 'p1',
        contactId: 'k1',
        name: 'Web',
        description: 'detalle',
      });
    });

    it('rechaza convertir una propuesta que no está aceptada', async () => {
      prisma.proposal.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'DRAFT',
        contactId: 'k1',
        title: 'Web',
      });

      await expect(
        service.convertToProject(OWNER, 'p1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(projects.createFromProposal).not.toHaveBeenCalled();
    });

    it('rechaza convertir una propuesta sin cliente', async () => {
      prisma.proposal.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'ACCEPTED',
        contactId: null,
        title: 'Web',
      });

      await expect(
        service.convertToProject(OWNER, 'p1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(projects.createFromProposal).not.toHaveBeenCalled();
    });

    it('aborta si la propuesta es de otra cuenta', async () => {
      prisma.proposal.findFirst.mockResolvedValue(null);

      await expect(
        service.convertToProject(OTHER, 'p1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(projects.createFromProposal).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId', async () => {
      prisma.proposal.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('findOne / update / remove', () => {
    it('findOne lanza NotFoundException para una propuesta de otra cuenta', async () => {
      prisma.proposal.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER, 'p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('update aborta sin escribir si la propuesta no es de la cuenta', async () => {
      prisma.proposal.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'p1', { title: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.proposal.update).not.toHaveBeenCalled();
    });

    it('remove aborta sin borrar si la propuesta no es de la cuenta', async () => {
      prisma.proposal.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 'p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.proposal.delete).not.toHaveBeenCalled();
    });
  });

  describe('findStaleSent (ámbito sistema)', () => {
    it('busca ENVIADAS con sentAt anterior al corte, sin filtrar por cuenta', async () => {
      prisma.proposal.findMany.mockResolvedValue([]);
      const cutoff = new Date('2026-01-01');

      await service.findStaleSent(cutoff);

      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SENT', sentAt: { not: null, lt: cutoff } },
        }),
      );
    });
  });
});
