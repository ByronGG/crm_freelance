import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma/client';

/** Contenido firmado dentro del access token. */
interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Estrategia 'jwt': valida el access token del header Authorization y deja
 * el usuario autenticado en request.user. JwtAuthGuard se apoya en ella.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /** Lo retornado aquí es lo que `@CurrentUser()` inyecta en los handlers. */
  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
