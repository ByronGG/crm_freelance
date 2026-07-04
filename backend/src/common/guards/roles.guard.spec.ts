import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { AuthUser } from '../decorators/current-user.decorator';

function contextWith(user: AuthUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

const admin: AuthUser = {
  id: 'u1',
  email: 'a@b.com',
  role: 'ADMIN',
  accountId: 'u1',
};
const member: AuthUser = {
  id: 'u2',
  email: 'm@b.com',
  role: 'MEMBER',
  accountId: 'u1',
};

describe('RolesGuard', () => {
  function guardRequiring(roles: string[] | undefined): RolesGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('permite la ruta cuando no declara @Roles', () => {
    expect(guardRequiring(undefined).canActivate(contextWith(member))).toBe(
      true,
    );
  });

  it('permite a un ADMIN una ruta @Roles(ADMIN)', () => {
    expect(guardRequiring(['ADMIN']).canActivate(contextWith(admin))).toBe(
      true,
    );
  });

  it('bloquea a un MEMBER en una ruta @Roles(ADMIN)', () => {
    expect(() =>
      guardRequiring(['ADMIN']).canActivate(contextWith(member)),
    ).toThrow(ForbiddenException);
  });

  it('bloquea si no hay usuario autenticado', () => {
    expect(() =>
      guardRequiring(['ADMIN']).canActivate(contextWith(undefined)),
    ).toThrow(ForbiddenException);
  });
});
