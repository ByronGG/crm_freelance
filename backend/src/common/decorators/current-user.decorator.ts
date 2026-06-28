import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';

/** Identidad del usuario autenticado, extraída del JWT por la estrategia. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Inyecta el usuario autenticado en un handler:
 *   `@CurrentUser() user: AuthUser` o `@CurrentUser('id') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
