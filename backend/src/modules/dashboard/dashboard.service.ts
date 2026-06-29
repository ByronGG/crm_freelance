import { Injectable } from '@nestjs/common';

import { DealsService } from '../deals/deals.service';
import { InvoicesService } from '../invoices/invoices.service';
import { TasksService } from '../activities/tasks.service';

/**
 * Lectura agregada para la pantalla de inicio. NO accede a ninguna tabla:
 * compone las lecturas públicas de deals, invoices y activities (tasks).
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly deals: DealsService,
    private readonly invoices: InvoicesService,
    private readonly tasks: TasksService,
  ) {}

  /** KPIs del negocio + tareas pendientes del día. */
  async getSummary(ownerId: string) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const endOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const [pipeline, receivables, monthIncome, pendingTasks] = await Promise.all([
      this.deals.getPipelineSummary(ownerId),
      this.invoices.getReceivablesSummary(ownerId),
      this.invoices.getIncomeForPeriod(ownerId, monthStart, monthEnd),
      this.tasks.findPendingDueBefore(ownerId, endOfToday),
    ]);

    return {
      pipeline,
      receivables,
      monthIncome,
      pendingToday: { count: pendingTasks.length, tasks: pendingTasks },
    };
  }
}
