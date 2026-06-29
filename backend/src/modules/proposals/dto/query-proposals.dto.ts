import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ProposalStatus } from '../../../generated/prisma/client';

/** Filtros para listar propuestas. */
export class QueryProposalsDto {
  @IsOptional()
  @IsEnum(ProposalStatus, { message: 'Estado no válido' })
  status?: ProposalStatus;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
