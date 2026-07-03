import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { startOfToday } from '../../common/date.util';
import { NotificationsService } from '../notifications/notifications.service';
import { ProposalsService } from './proposals.service';

// Días sin respuesta tras enviar una propuesta antes de recordar el seguimiento.
const FOLLOW_UP_DAYS = 7;

/**
 * Job de seguimiento de propuestas. A diario avisa de las propuestas ENVIADAS
 * que llevan FOLLOW_UP_DAYS días sin cambiar de estado (ni aceptadas ni
 * rechazadas). Idempotente (createIfAbsent), así que no re-notifica.
 */
@Injectable()
export class ProposalsScheduler implements OnModuleInit {
  private readonly logger = new Logger(ProposalsScheduler.name);

  constructor(
    private readonly proposals: ProposalsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    void this.run().catch((e) =>
      this.logger.error('Fallo al revisar propuestas en el arranque', e),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  handleCron(): Promise<void> {
    return this.run();
  }

  async run(): Promise<void> {
    const cutoff = startOfToday();
    cutoff.setDate(cutoff.getDate() - FOLLOW_UP_DAYS);

    const stale = await this.proposals.findStaleSent(cutoff);
    let created = 0;
    for (const proposal of stale) {
      const notification = await this.notifications.createIfAbsent(
        proposal.ownerId,
        {
          type: 'REMINDER',
          message: `La propuesta "${proposal.title}" lleva ${FOLLOW_UP_DAYS}+ días enviada sin respuesta`,
          link: `/proposals?focus=${proposal.id}`,
        },
      );
      if (notification) created++;
    }
    if (created > 0) {
      this.logger.log(`Recordatorios de seguimiento generados: ${created}`);
    }
  }
}
