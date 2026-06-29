import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { DealStage } from '../../../generated/prisma/client';

/** Datos para crear una oportunidad. */
export class CreateDealDto {
  @IsString()
  @MinLength(1, { message: 'El título es obligatorio' })
  @MaxLength(160)
  title: string;

  // Valor estimado de la oportunidad. Por defecto 0 si no se envía.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El valor debe ser numérico' })
  @Min(0, { message: 'El valor no puede ser negativo' })
  value?: number;

  // Etapa inicial; si se omite, el esquema usa NEW por defecto.
  @IsOptional()
  @IsEnum(DealStage, { message: 'Etapa no válida' })
  stage?: DealStage;

  // Fecha estimada de cierre (ISO 8601).
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de cierre no es válida' })
  expectedClose?: string;

  // Contacto asociado (opcional). Se valida que pertenezca a la misma cuenta.
  @IsOptional()
  @IsUUID()
  contactId?: string;
}
