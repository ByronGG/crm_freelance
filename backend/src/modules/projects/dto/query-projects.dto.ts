import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ProjectStatus } from '../../../generated/prisma/client';

/** Filtros para listar proyectos. */
export class QueryProjectsDto {
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado no válido' })
  status?: ProjectStatus;

  // Filtra por el cliente del proyecto (para la vista 360° del contacto).
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
