import { Module } from '@nestjs/common';

import { ProjectsModule } from '../projects/projects.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

// Módulo invoices: facturación y estado de cobro de los proyectos.
// Importa ProjectsModule para validar el proyecto de origen vía su servicio.
// Expone InvoicesService para que dashboard/reports lo consuman.
@Module({
  imports: [ProjectsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
