import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { endOfToday, startOfToday } from '../../common/date.util';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from './tasks.service';

/**
 * Job de recordatorios de tareas. A diario genera una notificación in-app por
 * cada tarea pendiente vencida o que vence hoy. Idempotente (createIfAbsent),
 * así que puede correr cada día sin duplicar avisos.
 */
@Injectable()
export class TasksScheduler implements OnModuleInit {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(
    private readonly tasks: TasksService,
    private readonly notifications: NotificationsService,
  ) {}

  // Al arrancar, ponerse al día con los vencimientos ya existentes.
  onModuleInit(): void {
    void this.run().catch((e) =>
      this.logger.error('Fallo al generar recordatorios en el arranque', e),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  handleCron(): Promise<void> {
    return this.run();
  }

  async run(): Promise<void> {
    const dayStart = startOfToday();
    const due = await this.tasks.findDueForReminder(endOfToday());
    let created = 0;
    for (const task of due) {
      const overdue = task.dueDate ? task.dueDate < dayStart : false;
      const prefix = overdue ? 'Tarea vencida' : 'Tarea vence hoy';
      const notification = await this.notifications.createIfAbsent(
        task.ownerId,
        {
          type: 'DUE_DATE',
          message: `${prefix}: "${task.title}"`,
          link: `/tasks?focus=${task.id}`,
        },
      );
      if (notification) created++;
    }
    if (created > 0) {
      this.logger.log(`Recordatorios de tareas generados: ${created}`);
    }
  }
}
