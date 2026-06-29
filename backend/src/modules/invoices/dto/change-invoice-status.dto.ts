import { IsEnum } from 'class-validator';

import { InvoiceStatus } from '../../../generated/prisma/client';

/** Cambia el estado de cobro: Borrador → Emitida → Pagada → Vencida. */
export class ChangeInvoiceStatusDto {
  @IsEnum(InvoiceStatus, { message: 'Estado de factura no válido' })
  status: InvoiceStatus;
}
