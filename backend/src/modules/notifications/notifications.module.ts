import { Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Módulo notifications: avisos in-app (recordatorios, vencimientos, etapas).
// Exporta NotificationsService para que otros módulos generen avisos.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
