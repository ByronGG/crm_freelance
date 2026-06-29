import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ProposalItemDto } from './proposal-item.dto';

/** Datos para crear una propuesta. El total se calcula a partir de los ítems. */
export class CreateProposalDto {
  @IsString()
  @MinLength(1, { message: 'El título es obligatorio' })
  @MaxLength(160)
  title: string;

  // Moneda ISO de 3 letras; por defecto USD si se omite.
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La moneda debe ser un código de 3 letras' })
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  // Contacto asociado (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  contactId?: string;

  // Oportunidad asociada (opcional). Se valida que pertenezca a la cuenta.
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProposalItemDto)
  items?: ProposalItemDto[];
}
