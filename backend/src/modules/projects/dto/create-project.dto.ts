import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ProjectStatus } from '../../../generated/prisma/client';

/** Datos para crear un proyecto. */
export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado no válido' })
  status?: ProjectStatus;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de inicio no es válida' })
  startDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de fin no es válida' })
  endDate?: string;

  // Oportunidad de la que deriva el proyecto (opcional). Se valida que sea de
  // la cuenta y que no tenga ya un proyecto asociado.
  @IsOptional()
  @IsUUID()
  dealId?: string;
}
