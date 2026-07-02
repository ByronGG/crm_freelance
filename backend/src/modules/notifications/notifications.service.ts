import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Notification } from '../../generated/prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

/**
 * Notificaciones in-app (campana). Aisladas por userId. El método create es
 * público para que otros módulos generen avisos (recordatorios, vencimientos,
 * cambios de etapa) a través de este servicio.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        message: dto.message,
        link: dto.link ?? null,
      },
    });
  }

  /**
   * Crea la notificación solo si no existe ya una del mismo tipo y enlace para
   * el usuario. Idempotente: los jobs de vencimientos pueden ejecutarse a diario
   * sin duplicar avisos (el `link` incluye el id de la entidad de origen).
   */
  async createIfAbsent(
    userId: string,
    dto: CreateNotificationDto,
  ): Promise<Notification | null> {
    const exists = await this.prisma.notification.findFirst({
      where: { userId, type: dto.type, link: dto.link ?? null },
      select: { id: true },
    });
    if (exists) return null;
    return this.create(userId, dto);
  }

  findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(query.read !== undefined ? { read: query.read === 'true' } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Número de notificaciones sin leer (para el badge de la campana). */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    await this.assertOwned(userId, id);
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /** Marca todas como leídas; devuelve cuántas se actualizaron. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.prisma.notification.delete({ where: { id } });
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const found = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Notificación no encontrada');
    }
  }
}
