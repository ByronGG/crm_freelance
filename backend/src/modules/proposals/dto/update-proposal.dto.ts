import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateProposalDto } from './create-proposal.dto';

/**
 * Actualización parcial de los datos de una propuesta. Los ítems (y por tanto
 * el total) se gestionan con su propio endpoint; el estado, con el suyo.
 */
export class UpdateProposalDto extends PartialType(
  OmitType(CreateProposalDto, ['items'] as const),
) {}
