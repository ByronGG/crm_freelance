import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { NotificationType } from '../../../generated/prisma/client';

/** Datos para crear una notificación in-app. */
export class CreateNotificationDto {
  @IsEnum(NotificationType, { message: 'Tipo de notificación no válido' })
  type: NotificationType;

  @IsString()
  @MinLength(1, { message: 'El mensaje es obligatorio' })
  @MaxLength(500)
  message: string;

  // Enlace opcional dentro de la app (p. ej. a la factura vencida).
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;
}
