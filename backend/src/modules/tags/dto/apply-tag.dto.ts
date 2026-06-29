import { IsEnum, IsUUID } from 'class-validator';

import { TaggableType } from '../../../generated/prisma/client';

/** Aplica/quita una etiqueta a un contacto u oportunidad. */
export class ApplyTagDto {
  @IsEnum(TaggableType, { message: 'Tipo de entidad no válido' })
  entityType: TaggableType;

  @IsUUID()
  entityId: string;
}
