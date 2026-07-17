import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// Módulo projects: proyectos contratados e hitos.
// Importa ContactsModule para validar el cliente del proyecto y DealsModule
// para consultar la oportunidad de origen (conversión oportunidad ganada →
// proyecto), siempre a través de sus servicios.
// Expone ProjectsService para que invoices lo consuma (factura desde proyecto)
// y proposals lo use (conversión propuesta aceptada → proyecto).
@Module({
  imports: [ContactsModule, DealsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
