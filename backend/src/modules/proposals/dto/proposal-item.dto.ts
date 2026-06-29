import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Línea de una propuesta: descripción, cantidad y precio unitario. */
export class ProposalItemDto {
  @IsString()
  @MinLength(1, { message: 'La descripción del ítem es obligatoria' })
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad debe ser numérica' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser numérico' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  unitPrice?: number;
}
