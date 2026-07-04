import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Registro de tiempo dedicado a un proyecto. */
export class CreateTimeEntryDto {
  @IsString()
  @MinLength(1, { message: 'La descripción es obligatoria' })
  @MaxLength(280)
  description: string;

  // Duración en minutos (el frontend convierte horas a minutos).
  @IsInt({ message: 'Los minutos deben ser un entero' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto' })
  @Max(100_000)
  minutes: number;

  // Fecha del trabajo (ISO 8601). Por defecto, hoy.
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha no es válida' })
  date?: string;
}
