import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../generated/prisma/client';

/**
 * Acceso a usuarios. Es el servicio público del módulo users: lo consume
 * auth para registrar e identificar cuentas. Ningún otro módulo accede a la
 * tabla User directamente.
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
}
