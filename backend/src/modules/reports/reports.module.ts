import { Module } from '@nestjs/common';

import { DealsModule } from '../deals/deals.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

// Módulo reports: lecturas agregadas (solo consulta).
// Importa los módulos dueños y consume sus servicios públicos, nunca sus tablas.
@Module({
  imports: [DealsModule, InvoicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
