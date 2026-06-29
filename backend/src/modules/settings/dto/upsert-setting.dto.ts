import { IsString, MaxLength } from 'class-validator';

/** Valor de un ajuste clave/valor (la clave va en la URL). */
export class UpsertSettingDto {
  @IsString()
  @MaxLength(2000)
  value: string;
}
