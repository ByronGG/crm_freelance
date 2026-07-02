import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { SettingsModule } from '../settings/settings.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesScheduler } from './invoices.scheduler';
import { InvoicesService } from './invoices.service';

// Módulo invoices: facturación y estado de cobro de los proyectos.
// Importa ProjectsModule para validar el proyecto de origen vía su servicio,
// NotificationsModule para el job de facturas vencidas y SettingsModule para
// el perfil de empresa que encabeza el PDF.
// Expone InvoicesService para que dashboard/reports lo consuman.
@Module({
  imports: [ProjectsModule, NotificationsModule, SettingsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesScheduler],
  exports: [InvoicesService],
})
export class InvoicesModule {}
