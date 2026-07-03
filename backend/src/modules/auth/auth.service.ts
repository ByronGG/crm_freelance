import { randomUUID } from 'crypto';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Role, User } from '../../generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Datos base firmados en el access token. */
interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

/** El refresh token además lleva un `jti` para poder rotarlo/revocarlo. */
interface RefreshPayload extends TokenPayload {
  jti: string;
}

/** Vista pública del usuario que se devuelve al cliente (sin el hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

// Coste de bcrypt: equilibrio entre seguridad y latencia del login.
const BCRYPT_ROUNDS = 12;

/**
 * Lógica de autenticación: registro, login y renovación de tokens.
 * No accede a la BD directamente; delega en UsersService.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** Crea una cuenta nueva y devuelve el par de tokens. */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  /** Valida credenciales y devuelve el par de tokens. */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    // Mismo error para usuario inexistente o contraseña incorrecta: no revela
    // si el email existe.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  /** Devuelve el perfil completo del usuario autenticado (incluye el nombre). */
  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sesión no válida');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Verifica el refresh token, lo ROTA (revoca el usado y emite uno nuevo) y
   * devuelve un par nuevo. Si se reusa un token ya revocado, se asume robo y se
   * invalida toda la sesión del usuario.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    // Token desconocido: nunca se emitió o ya se limpió.
    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    // Reuso de un token ya rotado/revocado → posible robo: corta toda la sesión.
    if (stored.revokedAt) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Sesión invalidada por seguridad');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotación: revoca el token usado antes de emitir el nuevo par.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.buildAuthResponse(user);
  }

  /** Cierra sesión revocando el refresh token presentado (idempotente). */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Token inválido o ya expirado: el logout es idempotente, no fallamos.
    }
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Construye la respuesta de auth: usuario público + tokens. */
  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Firma el access token (vida corta) y el refresh token (vida larga). El
   * refresh se persiste con su `jti` para poder rotarlo y revocarlo.
   */
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const base: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(
        base,
        this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      ),
      this.signToken(
        { ...base, jti },
        this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    ]);

    // La fecha de expiración del registro sigue la del propio token firmado.
    const decoded: unknown = this.jwt.decode(refreshToken);
    const exp =
      typeof decoded === 'object' && decoded !== null && 'exp' in decoded
        ? Number((decoded as { exp?: unknown }).exp)
        : NaN;
    const expiresAt = Number.isFinite(exp)
      ? new Date(exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { id: jti, userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Firma un token. `expiresIn` admite formatos tipo "15m"/"7d" (string) o
   * segundos (number); el tipado de jsonwebtoken es estricto con el string,
   * por eso se centraliza aquí el único cast necesario.
   */
  private signToken(
    payload: TokenPayload | RefreshPayload,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret,
      expiresIn: expiresIn as unknown as number,
    });
  }
}
