import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { Role, User } from '../../generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Datos firmados en los tokens (access y refresh comparten forma). */
interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
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

  /** Verifica el refresh token y emite un par de tokens nuevo. */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    return this.buildAuthResponse(user);
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

  /** Firma el access token (vida corta) y el refresh token (vida larga). */
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(
        payload,
        this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      ),
      this.signToken(
        payload,
        this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Firma un token. `expiresIn` admite formatos tipo "15m"/"7d" (string) o
   * segundos (number); el tipado de jsonwebtoken es estricto con el string,
   * por eso se centraliza aquí el único cast necesario.
   */
  private signToken(
    payload: TokenPayload,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret,
      expiresIn: expiresIn as unknown as number,
    });
  }
}
