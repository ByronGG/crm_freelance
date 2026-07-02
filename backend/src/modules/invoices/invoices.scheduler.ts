import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { startOfToday } from '../../common/date.util';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from './invoices.service';

/**
 * Job de vencimiento de facturas. A diario marca como VENCIDAS las facturas
 * emitidas cuya fecha ya pasó y genera un aviso in-app por cada una.
 * Idempotente (createIfAbsent): no re-notifica en ejecuciones posteriores.
 */
@Injectable()
export class InvoicesScheduler implements OnModuleInit {
  private readonly logger = new Logger(InvoicesScheduler.name);

  constructor(
    private readonly invoices: InvoicesService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    void this.run().catch((e) =>
      this.logger.error('Fallo al procesar vencimientos en el arranque', e),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  handleCron(): Promise<void> {
    return this.run();
  }

  async run(): Promise<void> {
    const overdue = await this.invoices.markOverdue(startOfToday());
    let created = 0;
    for (const invoice of overdue) {
      const notification = await this.notifications.createIfAbsent(
        invoice.ownerId,
        {
          type: 'INVOICE_OVERDUE',
          message: `Factura ${invoice.number} vencida`,
          link: `/invoices?focus=${invoice.id}`,
        },
      );
      if (notification) created++;
    }
    if (overdue.length > 0) {
      this.logger.log(
        `Facturas marcadas como vencidas: ${overdue.length} (avisos nuevos: ${created})`,
      );
    }
  }
}
