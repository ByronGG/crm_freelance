import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

/** Datos para generar una factura a partir de un proyecto. */
export class CreateInvoiceDto {
  // Proyecto del que deriva la factura. Se valida que sea de la cuenta.
  @IsUUID()
  projectId: string;

  // Número de factura; si se omite, se genera automáticamente (INV-0001…).
  @IsOptional()
  @IsString()
  @MaxLength(40)
  number?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La moneda debe ser un código de 3 letras' })
  currency?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El total debe ser numérico' })
  @Min(0, { message: 'El total no puede ser negativo' })
  total?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de vencimiento no es válida' })
  dueDate?: string;
}
