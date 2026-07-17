import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ActivityType } from '../../../generated/prisma/client';

/** Datos para registrar una actividad (nota, llamada, correo, reunión). */
export class CreateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Tipo de actividad no válido' })
  type?: ActivityType;

  @IsString()
  @MinLength(1, { message: 'El contenido es obligatorio' })
  @MaxLength(2000)
  content: string;

  // Contacto asociado (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  contactId?: string;

  // Oportunidad asociada (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  dealId?: string;

  // Proyecto asociado (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
