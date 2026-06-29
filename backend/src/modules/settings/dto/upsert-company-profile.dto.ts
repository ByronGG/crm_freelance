import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Datos de empresa del usuario, usados para emitir facturas. */
export class UpsertCompanyProfileDto {
  @IsString()
  @MinLength(1, { message: 'El nombre del negocio es obligatorio' })
  @MaxLength(160)
  businessName: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;
}
