import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../generated/prisma/client';
import { CreateMemberDto } from './dto/create-member.dto';

// Coste de bcrypt (igual que en auth) para hashear la contraseña del miembro.
const BCRYPT_ROUNDS = 12;

// Vista pública de un usuario del equipo (sin el hash de contraseña).
const TEAM_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  accountOwnerId: true,
  createdAt: true,
} as const;

/**
 * Acceso a usuarios. Es el servicio público del módulo users: lo consume
 * auth para registrar e identificar cuentas, y expone la gestión del equipo
 * (modo agencia) para el ADMIN dueño de la cuenta.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca un usuario por email (o null si no existe). */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Busca un usuario por id (o null si no existe). */
  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Crea un usuario con la contraseña ya hasheada por auth. */
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Miembros de la cuenta: el ADMIN dueño + sus MEMBER. */
  listTeam(accountId: string) {
    return this.prisma.user.findMany({
      where: { OR: [{ id: accountId }, { accountOwnerId: accountId }] },
      select: TEAM_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Da de alta un MEMBER dentro de la cuenta (solo lo llama un ADMIN). */
  async createMember(accountId: string, dto: CreateMemberDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: 'MEMBER',
        accountOwnerId: accountId,
      },
      select: TEAM_SELECT,
    });
  }

  /**
   * Elimina un MEMBER de la cuenta. No permite borrar al ADMIN (no es miembro
   * de nadie) ni a miembros de otra cuenta: se acota por accountOwnerId.
   */
  async removeMember(accountId: string, memberId: string): Promise<void> {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, accountOwnerId: accountId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }
    await this.prisma.user.delete({ where: { id: memberId } });
  }
}
