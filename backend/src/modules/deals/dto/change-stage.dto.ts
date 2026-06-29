import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { DealStage } from '../../../generated/prisma/client';

/** Cambio de etapa de una oportunidad (mueve la tarjeta en el Kanban). */
export class ChangeStageDto {
  @IsEnum(DealStage, { message: 'Etapa no válida' })
  stage: DealStage;

  // Motivo de pérdida; solo se conserva cuando la etapa pasa a LOST.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}
