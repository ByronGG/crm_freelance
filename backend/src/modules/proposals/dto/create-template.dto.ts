import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ProposalItemDto } from './proposal-item.dto';

/** Datos para crear una plantilla de propuesta reutilizable. */
export class CreateProposalTemplateDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La moneda debe ser un código de 3 letras' })
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProposalItemDto)
  items?: ProposalItemDto[];
}
