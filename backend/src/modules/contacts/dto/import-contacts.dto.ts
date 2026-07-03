import { IsString, MaxLength, MinLength } from 'class-validator';

/** Contenido CSV a importar (texto plano; el frontend lee el archivo). */
export class ImportContactsDto {
  @IsString()
  @MinLength(1, { message: 'El CSV está vacío' })
  @MaxLength(1_000_000, { message: 'El archivo es demasiado grande' })
  csv: string;
}
