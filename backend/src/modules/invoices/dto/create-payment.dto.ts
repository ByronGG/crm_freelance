import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/** Registro de un pago (total o parcial) sobre una factura. */
export class CreatePaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El importe debe ser numérico' })
  @IsPositive({ message: 'El importe debe ser mayor que cero' })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  method?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de pago no es válida' })
  paidAt?: string;
}
