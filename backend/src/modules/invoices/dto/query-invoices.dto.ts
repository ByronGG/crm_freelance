import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { InvoiceStatus } from '../../../generated/prisma/client';

/** Filtros para listar facturas. */
export class QueryInvoicesDto {
  @IsOptional()
  @IsEnum(InvoiceStatus, { message: 'Estado de factura no válido' })
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  // Búsqueda libre por número de factura.
  @IsOptional()
  @IsString()
  @MaxLength(40)
  search?: string;
}
