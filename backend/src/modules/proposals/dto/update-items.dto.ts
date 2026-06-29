import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';

import { ProposalItemDto } from './proposal-item.dto';

/** Reemplaza la lista completa de ítems de una propuesta y recalcula el total. */
export class UpdateItemsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProposalItemDto)
  items: ProposalItemDto[];
}
