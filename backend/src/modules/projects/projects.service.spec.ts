import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from './projects.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ProjectsService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let deals: { assertOwned: jest.Mock; findOne: jest.Mock };
  let contacts: { assertOwned: jest.Mock };
  let service: ProjectsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    deals = { assertOwned: jest.fn(), findOne: jest.fn() };
    contacts = { assertOwned: jest.fn() };
    service = new ProjectsService(
      asPrisma(prisma),
      deals as unknown as DealsService,
      contacts as unknown as ContactsService,
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

    it('filtra por el cliente directo del proyecto (vista 360°)', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, { contactId: 'k1' });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: OWNER,
            contactId: 'k1',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('valida el cliente y crea el proyecto con su contactId', async () => {
      prisma.project.create.mockResolvedValue({ id: 'pr1' });

      await service.create(OWNER, { name: 'Web', contactId: 'k1' });

      expect(contacts.assertOwned).toHaveBeenCalledWith(OWNER, 'k1');
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: OWNER, contactId: 'k1' }),
        }),
      );
    });

    it('no crea el proyecto si el cliente es de otra cuenta', async () => {
      contacts.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { name: 'Web', contactId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('rechaza si la oportunidad pertenece a otro cliente', async () => {
      deals.findOne.mockResolvedValue({ id: 'd1', contactId: 'otro' });

      await expect(
        service.create(OWNER, { name: 'Web', contactId: 'k1', dealId: 'd1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('createFromDeal', () => {
    it('hereda el cliente de la oportunidad ganada', async () => {
      deals.findOne.mockResolvedValue({
        id: 'd1',
        stage: 'WON',
        contactId: 'k1',
        title: 'Trato',
      });
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: 'pr1' });

      await service.createFromDeal(OWNER, 'd1');

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: OWNER,
            contactId: 'k1',
            dealId: 'd1',
          }),
        }),
      );
    });

    it('rechaza convertir una oportunidad sin cliente', async () => {
      deals.findOne.mockResolvedValue({
        id: 'd1',
        stage: 'WON',
        contactId: null,
        title: 'Trato',
      });

      await expect(service.createFromDeal(OWNER, 'd1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.project.create).not.toHaveBeenCalled();
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

  describe('createFromProposal', () => {
    it('crea el proyecto enlazado a la propuesta, con su cliente', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: 'pr1' });

      await service.createFromProposal(OWNER, {
        proposalId: 'p1',
        contactId: 'k1',
        name: 'Web',
      });

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { proposalId: 'p1' },
        select: { id: true },
      });
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: OWNER,
            contactId: 'k1',
            proposalId: 'p1',
            name: 'Web',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('rechaza si la propuesta ya tiene un proyecto', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'existente' });

      await expect(
        service.createFromProposal(OWNER, {
          proposalId: 'p1',
          contactId: 'k1',
          name: 'Web',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.project.create).not.toHaveBeenCalled();
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

  describe('getContactId', () => {
    it('devuelve el cliente del proyecto acotando por ownerId', async () => {
      prisma.project.findFirst.mockResolvedValue({
        id: 'pr1',
        contactId: 'k1',
      });

      await expect(service.getContactId(OWNER, 'pr1')).resolves.toBe('k1');
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'pr1', ownerId: OWNER },
        select: { id: true, contactId: true },
      });
    });

    it('lanza NotFoundException para un proyecto de otra cuenta', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getContactId(OTHER, 'pr1')).rejects.toBeInstanceOf(
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
