import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Datos para crear una empresa. */
export class CreateCompanyDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;
}
