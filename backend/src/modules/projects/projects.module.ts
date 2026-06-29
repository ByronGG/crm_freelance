import { Module } from '@nestjs/common';

import { DealsModule } from '../deals/deals.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// Módulo projects: proyectos contratados e hitos.
// Importa DealsModule para consultar la oportunidad de origen (conversión
// de oportunidad ganada → proyecto) a través de su servicio.
// Expone ProjectsService para que invoices lo consuma (factura desde proyecto).
@Module({
  imports: [DealsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
