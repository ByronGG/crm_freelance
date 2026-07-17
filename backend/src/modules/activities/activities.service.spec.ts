import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { ProjectsService } from '../projects/projects.service';
import { ActivitiesService } from './activities.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ActivitiesService (aislamiento y validación de relaciones)', () => {
  let prisma: PrismaMock;
  let contacts: { assertOwned: jest.Mock };
  let deals: { assertOwned: jest.Mock };
  let projects: { assertOwned: jest.Mock };
  let service: ActivitiesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    contacts = { assertOwned: jest.fn() };
    deals = { assertOwned: jest.fn() };
    projects = { assertOwned: jest.fn() };
    service = new ActivitiesService(
      asPrisma(prisma),
      contacts as unknown as ContactsService,
      deals as unknown as DealsService,
      projects as unknown as ProjectsService,
    );
  });

  describe('create', () => {
    it('crea la actividad con ownerId y tipo por defecto NOTE', async () => {
      prisma.activity.create.mockResolvedValue({ id: 'a1' });

      await service.create(OWNER, { content: 'Llamada hecha' });

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: OWNER, type: 'NOTE' }),
      });
    });

    it('valida el contacto, la oportunidad y el proyecto vía sus servicios', async () => {
      prisma.activity.create.mockResolvedValue({ id: 'a1' });

      await service.create(OWNER, {
        content: 'Nota',
        contactId: 'k1',
        dealId: 'd1',
        projectId: 'pr1',
      });

      expect(contacts.assertOwned).toHaveBeenCalledWith(OWNER, 'k1');
      expect(deals.assertOwned).toHaveBeenCalledWith(OWNER, 'd1');
      expect(projects.assertOwned).toHaveBeenCalledWith(OWNER, 'pr1');
    });

    it('no crea la actividad si el proyecto asociado es de otra cuenta', async () => {
      projects.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { content: 'Nota', projectId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.activity.create).not.toHaveBeenCalled();
    });

    it('no crea la actividad si el contacto asociado es de otra cuenta', async () => {
      contacts.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OWNER, { content: 'Nota', contactId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra siempre por ownerId (timeline acotada a la cuenta)', async () => {
      prisma.activity.findMany.mockResolvedValue([]);

      await service.findAll(OWNER, {});

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: OWNER }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException para una actividad de otra cuenta', async () => {
      prisma.activity.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER, 'a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.activity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'a1', ownerId: OTHER } }),
      );
    });
  });

  describe('update / remove', () => {
    it('update aborta sin escribir si la actividad no es de la cuenta', async () => {
      prisma.activity.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER, 'a1', { content: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.activity.update).not.toHaveBeenCalled();
    });

    it('remove aborta sin borrar si la actividad no es de la cuenta', async () => {
      prisma.activity.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 'a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.activity.delete).not.toHaveBeenCalled();
    });
  });
});
