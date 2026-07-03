import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const USER = { id: 'u1', email: 'a@b.com', name: 'Ana', role: 'ADMIN' };
const FUTURE = Math.floor(Date.now() / 1000) + 3600;

describe('AuthService (rotación y revocación de refresh tokens)', () => {
  let prisma: PrismaMock;
  let users: { findById: jest.Mock };
  let jwt: { verifyAsync: jest.Mock; signAsync: jest.Mock; decode: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    users = { findById: jest.fn().mockResolvedValue(USER) };
    jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'u1',
        email: 'a@b.com',
        role: 'ADMIN',
        jti: 'jti-1',
      }),
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      decode: jest.fn().mockReturnValue({ exp: FUTURE }),
    };
    const config = { getOrThrow: jest.fn(() => 'secret') };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      asPrisma(prisma),
    );
  });

  describe('refresh', () => {
    it('rota: revoca el token usado y emite (persiste) uno nuevo', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'jti-1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600_000),
      });

      const result = await service.refresh('valid-token');

      // Revoca exactamente el token presentado.
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'jti-1' },
        data: { revokedAt: expect.any(Date) },
      });
      // Emite y persiste el nuevo refresh token.
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-token');
    });

    it('detecta reuso: si el token ya estaba revocado, invalida toda la sesión', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'jti-1',
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      });

      await expect(service.refresh('reused-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rechaza un jti desconocido (nunca emitido)', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('rechaza un token expirado en la BD aunque la firma sea válida', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'jti-1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('expired')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revoca el refresh token presentado (idempotente)', async () => {
      await service.logout('valid-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'jti-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('no falla si el token es inválido', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(service.logout('garbage')).resolves.toBeUndefined();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
