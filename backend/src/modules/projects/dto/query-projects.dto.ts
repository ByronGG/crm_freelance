import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ProjectStatus } from '../../../generated/prisma/client';

/** Filtros para listar proyectos. */
export class QueryProjectsDto {
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado no válido' })
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
