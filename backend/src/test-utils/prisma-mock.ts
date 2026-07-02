import { PrismaService } from '../prisma/prisma.service';

/** Conjunto de operaciones mockeadas de un modelo de Prisma. */
export interface MockDelegate {
  findFirst: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findUniqueOrThrow: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  groupBy: jest.Mock;
  aggregate: jest.Mock;
}

function delegate(): MockDelegate {
  return {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  };
}

/** Mock tipado de PrismaService con un delegate por modelo del esquema. */
export interface PrismaMock {
  company: MockDelegate;
  contact: MockDelegate;
  deal: MockDelegate;
  dealStageHistory: MockDelegate;
  proposal: MockDelegate;
  proposalItem: MockDelegate;
  project: MockDelegate;
  milestone: MockDelegate;
  activity: MockDelegate;
  task: MockDelegate;
  invoice: MockDelegate;
  payment: MockDelegate;
  notification: MockDelegate;
  tag: MockDelegate;
  taggable: MockDelegate;
  attachment: MockDelegate;
  $transaction: jest.Mock;
}

/**
 * Crea un mock de PrismaService para pruebas unitarias de servicios. Cada
 * operación es un `jest.fn()` sin comportamiento por defecto; cada test
 * configura los `mockResolvedValue` que necesita.
 */
export function createPrismaMock(): PrismaMock {
  return {
    company: delegate(),
    contact: delegate(),
    deal: delegate(),
    dealStageHistory: delegate(),
    proposal: delegate(),
    proposalItem: delegate(),
    project: delegate(),
    milestone: delegate(),
    activity: delegate(),
    task: delegate(),
    invoice: delegate(),
    payment: delegate(),
    notification: delegate(),
    tag: delegate(),
    taggable: delegate(),
    attachment: delegate(),
    // Por defecto ejecuta las operaciones del array de la transacción.
    $transaction: jest.fn((ops: unknown) =>
      Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(ops),
    ),
  };
}

/** Facilita inyectar el mock donde se espera un PrismaService. */
export function asPrisma(mock: PrismaMock): PrismaService {
  return mock as unknown as PrismaService;
}
