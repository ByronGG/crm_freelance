import { Injectable } from '@nestjs/common';

import { DealsService } from '../deals/deals.service';
import { InvoicesService } from '../invoices/invoices.service';

/**
 * Reportes de solo lectura. Como dashboard, no accede a ninguna tabla: compone
 * las lecturas públicas de deals e invoices.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly deals: DealsService,
    private readonly invoices: InvoicesService,
  ) {}

  /** Conversión del pipeline (ganadas / cerradas) y desglose por etapa. */
  getPipeline(ownerId: string) {
    return this.deals.getPipelineSummary(ownerId);
  }

  /** Ingresos mes a mes (gráfica de ingresos). */
  getIncomeByMonth(ownerId: string, months = 6) {
    return this.invoices.getIncomeByMonth(ownerId, months);
  }
}
