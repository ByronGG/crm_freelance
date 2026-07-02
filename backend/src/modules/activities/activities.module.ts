import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { TasksController } from './tasks.controller';
import { TasksScheduler } from './tasks.scheduler';
import { TasksService } from './tasks.service';

// Módulo activities: dueño de las entidades Activity y Task.
// Importa ContactsModule y DealsModule para validar el contacto/oportunidad
// asociados, y NotificationsModule para el job de recordatorios de tareas.
// Expone sus servicios para que dashboard y notifications los usen.
@Module({
  imports: [ContactsModule, DealsModule, NotificationsModule],
  controllers: [ActivitiesController, TasksController],
  providers: [ActivitiesService, TasksService, TasksScheduler],
  exports: [ActivitiesService, TasksService],
})
export class ActivitiesModule {}
