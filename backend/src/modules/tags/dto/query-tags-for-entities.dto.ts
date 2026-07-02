import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsEnum, IsUUID } from 'class-validator';

import { TaggableType } from '../../../generated/prisma/client';

/**
 * Consulta batch: etiquetas de varias entidades a la vez. Evita el N+1 al
 * pintar chips en los listados (p. ej. la tabla de contactos).
 */
export class QueryTagsForEntitiesDto {
  @IsEnum(TaggableType, { message: 'Tipo de entidad no válido' })
  entityType: TaggableType;

  // Ids separados por comas: ?ids=uuid1,uuid2,uuid3
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsUUID('4', { each: true })
  @ArrayMaxSize(200)
  ids: string[];
}
