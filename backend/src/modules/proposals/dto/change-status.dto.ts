import { IsEnum } from 'class-validator';

import { ProposalStatus } from '../../../generated/prisma/client';

/** Cambia el estado de la propuesta: Borrador → Enviada → Aceptada/Rechazada. */
export class ChangeStatusDto {
  @IsEnum(ProposalStatus, { message: 'Estado no válido' })
  status: ProposalStatus;
}
