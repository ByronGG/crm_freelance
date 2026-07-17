import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { TaskStatus } from '../../../generated/prisma/client';

/** Filtros para listar tareas. */
export class QueryTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Estado de tarea no válido' })
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  // Filtra las tareas de un proyecto (para el detalle del proyecto).
  @IsOptional()
  @IsUUID()
  projectId?: string;

  // Tareas que vencen antes de esta fecha (útil para "pendientes del día").
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha no es válida' })
  dueBefore?: string;
}
