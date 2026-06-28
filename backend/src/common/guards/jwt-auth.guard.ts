import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protege rutas exigiendo un access token válido.
 * Usa la estrategia 'jwt' que define el módulo auth.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
