import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateDealDto } from './create-deal.dto';

/**
 * Actualización parcial de una oportunidad. La etapa NO se cambia por aquí:
 * tiene su propio endpoint para registrar el historial de avance.
 */
export class UpdateDealDto extends PartialType(
  OmitType(CreateDealDto, ['stage'] as const),
) {}
