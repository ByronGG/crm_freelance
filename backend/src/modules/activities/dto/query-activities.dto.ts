import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { ActivityType } from '../../../generated/prisma/client';

/** Filtros para listar actividades (también sirve de timeline por contacto). */
export class QueryActivitiesDto {
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Tipo de actividad no válido' })
  type?: ActivityType;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  // Filtra la actividad de un proyecto (para el detalle del proyecto).
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
