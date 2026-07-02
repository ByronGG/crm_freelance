import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesScheduler } from './invoices.scheduler';
import { InvoicesService } from './invoices.service';

// Módulo invoices: facturación y estado de cobro de los proyectos.
// Importa ProjectsModule para validar el proyecto de origen vía su servicio, y
// NotificationsModule para el job de facturas vencidas.
// Expone InvoicesService para que dashboard/reports lo consuman.
@Module({
  imports: [ProjectsModule, NotificationsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesScheduler],
  exports: [InvoicesService],
})
export class InvoicesModule {}
