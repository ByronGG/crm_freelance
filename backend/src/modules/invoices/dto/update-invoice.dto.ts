import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateInvoiceDto } from './create-invoice.dto';

/**
 * Actualización parcial de una factura. El proyecto de origen no se cambia;
 * el estado y los pagos tienen sus propios endpoints.
 */
export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ['projectId'] as const),
) {}
