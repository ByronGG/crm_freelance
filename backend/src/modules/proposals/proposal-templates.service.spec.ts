import { NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { ProposalTemplatesService } from './proposal-templates.service';

const OWNER = 'owner-1';
const OTHER = 'owner-2';

describe('ProposalTemplatesService (aislamiento por ownerId)', () => {
  let prisma: PrismaMock;
  let service: ProposalTemplatesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ProposalTemplatesService(asPrisma(prisma));
  });

  it('create guarda con ownerId y crea los ítems', async () => {
    prisma.proposalTemplate.create.mockResolvedValue({ id: 't1' });

    await service.create(OWNER, {
      name: 'Web básica',
      items: [{ description: 'Diseño', quantity: 1, unitPrice: 500 }],
    });

    expect(prisma.proposalTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: OWNER, name: 'Web básica' }),
      }),
    );
  });

  it('findAll filtra siempre por ownerId', async () => {
    prisma.proposalTemplate.findMany.mockResolvedValue([]);

    await service.findAll(OWNER);

    expect(prisma.proposalTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: OWNER } }),
    );
  });

  it('findOne lanza NotFoundException para una plantilla de otra cuenta', async () => {
    prisma.proposalTemplate.findFirst.mockResolvedValue(null);

    await expect(service.findOne(OTHER, 't1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove aborta sin borrar si la plantilla no es de la cuenta', async () => {
    prisma.proposalTemplate.findFirst.mockResolvedValue(null);

    await expect(service.remove(OTHER, 't1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.proposalTemplate.delete).not.toHaveBeenCalled();
  });
});
