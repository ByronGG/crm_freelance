import { IsBooleanString, IsOptional } from 'class-validator';

/** Filtros para listar notificaciones. */
export class QueryNotificationsDto {
  // ?read=true|false para filtrar por leídas/no leídas.
  @IsOptional()
  @IsBooleanString({ message: 'read debe ser true o false' })
  read?: string;
}
