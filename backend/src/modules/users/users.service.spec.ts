import { ConflictException, NotFoundException } from '@nestjs/common';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { UsersService } from './users.service';

const ACCOUNT = 'account-1';
const OTHER = 'account-2';

describe('UsersService (equipo · modo agencia)', () => {
  let prisma: PrismaMock;
  let service: UsersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(asPrisma(prisma));
  });

  describe('listTeam', () => {
    it('lista al ADMIN dueño y a sus miembros', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.listTeam(ACCOUNT);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ id: ACCOUNT }, { accountOwnerId: ACCOUNT }] },
        }),
      );
    });
  });

  describe('createMember', () => {
    it('crea el usuario como MEMBER dentro de la cuenta', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'm1' });

      await service.createMember(ACCOUNT, {
        email: 'nuevo@equipo.com',
        name: 'Nuevo',
        password: 'password123',
      });

      const arg = prisma.user.create.mock.calls[0][0];
      expect(arg.data).toEqual(
        expect.objectContaining({
          email: 'nuevo@equipo.com',
          role: 'MEMBER',
          accountOwnerId: ACCOUNT,
        }),
      );
      // La contraseña se guarda hasheada, nunca en claro.
      expect(arg.data.passwordHash).not.toBe('password123');
    });

    it('rechaza si el email ya está registrado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existe' });

      await expect(
        service.createMember(ACCOUNT, {
          email: 'ocupado@equipo.com',
          name: 'X',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('borra un miembro de la propia cuenta', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'm1' });

      await service.removeMember(ACCOUNT, 'm1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'm1', accountOwnerId: ACCOUNT },
        select: { id: true },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });

    it('no borra a un usuario que no es miembro de la cuenta', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.removeMember(OTHER, 'm1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
