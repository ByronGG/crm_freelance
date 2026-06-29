import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DealsModule } from '../deals/deals.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Módulo dashboard: lectura agregada de métricas para la pantalla de inicio.
// Importa los módulos dueños y consume sus servicios públicos, nunca sus tablas.
@Module({
  imports: [DealsModule, InvoicesModule, ActivitiesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
