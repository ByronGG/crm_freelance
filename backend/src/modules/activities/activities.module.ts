import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

// Módulo activities: dueño de las entidades Activity y Task.
// Importa ContactsModule y DealsModule para validar el contacto/oportunidad
// asociados. Expone sus servicios para que dashboard y notifications los usen.
@Module({
  imports: [ContactsModule, DealsModule],
  controllers: [ActivitiesController, TasksController],
  providers: [ActivitiesService, TasksService],
  exports: [ActivitiesService, TasksService],
})
export class ActivitiesModule {}
