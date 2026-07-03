import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/deals.service';
import { TagsService } from './tags.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('TagsService (aislamiento por ownerId y validación de entidad)', () => {
  let prisma: PrismaMock;
  let contacts: { assertOwned: jest.Mock };
  let deals: { assertOwned: jest.Mock };
  let service: TagsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    contacts = { assertOwned: jest.fn() };
    deals = { assertOwned: jest.fn() };
    service = new TagsService(
      asPrisma(prisma),
      contacts as unknown as ContactsService,
      deals as unknown as DealsService,
    );
  });

  describe('create / findAll', () => {
    it('crea la etiqueta con el ownerId de la sesión', async () => {
      prisma.tag.create.mockResolvedValue({ id: 't1' });

      await service.create(OWNER, { name: 'VIP' });

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: OWNER, name: 'VIP' }),
      });
    });

    it('findAll filtra siempre por ownerId', async () => {
      prisma.tag.findMany.mockResolvedValue([]);

      await service.findAll(OWNER);

      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: OWNER } }),
      );
    });
  });

  describe('apply', () => {
    it('valida la etiqueta y la entidad (contacto) antes de aplicar', async () => {
      prisma.tag.findFirst.mockResolvedValue({ id: 't1' });
      prisma.taggable.create.mockResolvedValue({ id: 'tg1' });

      await service.apply(OWNER, 't1', {
        entityType: 'CONTACT',
        entityId: 'k1',
      });

      expect(contacts.assertOwned).toHaveBeenCalledWith(OWNER, 'k1');
      expect(prisma.taggable.create).toHaveBeenCalled();
    });

    it('no aplica si la etiqueta es de otra cuenta', async () => {
      prisma.tag.findFirst.mockResolvedValue(null);

      await expect(
        service.apply(OTHER, 't1', { entityType: 'CONTACT', entityId: 'k1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(contacts.assertOwned).not.toHaveBeenCalled();
      expect(prisma.taggable.create).not.toHaveBeenCalled();
    });

    it('no aplica si la entidad (oportunidad) es de otra cuenta', async () => {
      prisma.tag.findFirst.mockResolvedValue({ id: 't1' });
      deals.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.apply(OWNER, 't1', { entityType: 'DEAL', entityId: 'ajeno' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.taggable.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('aborta sin borrar si la etiqueta no es de la cuenta', async () => {
      prisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER, 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.tag.delete).not.toHaveBeenCalled();
    });
  });

  describe('listForEntities', () => {
    it('acota por tag.ownerId al consultar en batch', async () => {
      prisma.taggable.findMany.mockResolvedValue([]);

      await service.listForEntities(OWNER, 'CONTACT', ['k1', 'k2']);

      expect(prisma.taggable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tag: { ownerId: OWNER } }),
        }),
      );
    });

    it('devuelve vacío sin consultar cuando no hay ids', async () => {
      const result = await service.listForEntities(OWNER, 'CONTACT', []);

      expect(result).toEqual([]);
      expect(prisma.taggable.findMany).not.toHaveBeenCalled();
    });
  });
});
