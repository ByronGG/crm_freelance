import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Datos para crear una etiqueta. */
export class CreateTagDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(60)
  name: string;

  // Color opcional (p. ej. "#FF8800") para mostrar la etiqueta.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
