import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { DealStage } from '../../../generated/prisma/client';

/** Filtros para listar oportunidades. */
export class QueryDealsDto {
  @IsOptional()
  @IsEnum(DealStage, { message: 'Etapa no válida' })
  stage?: DealStage;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  // Búsqueda libre por título.
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
