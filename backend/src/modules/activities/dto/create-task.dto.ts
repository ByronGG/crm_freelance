import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TaskStatus } from '../../../generated/prisma/client';

/** Datos para crear una tarea de seguimiento. */
export class CreateTaskDto {
  @IsString()
  @MinLength(1, { message: 'El título es obligatorio' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de vencimiento no es válida' })
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Estado de tarea no válido' })
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  // Proyecto asociado (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
