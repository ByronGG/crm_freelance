import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { AttachableType } from '../../../generated/prisma/client';

/** Filtros para listar adjuntos (normalmente por entidad). */
export class QueryAttachmentsDto {
  @IsOptional()
  @IsEnum(AttachableType, { message: 'Tipo de entidad no válido' })
  entityType?: AttachableType;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
