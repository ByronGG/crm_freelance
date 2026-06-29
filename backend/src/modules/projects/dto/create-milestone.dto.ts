import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MilestoneStatus } from '../../../generated/prisma/client';

/** Datos para crear un hito de proyecto. */
export class CreateMilestoneDto {
  @IsString()
  @MinLength(1, { message: 'El título es obligatorio' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de vencimiento no es válida' })
  dueDate?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus, { message: 'Estado de hito no válido' })
  status?: MilestoneStatus;
}
