import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Datos para crear un contacto. */
export class CreateContactDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(120)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  // Empresa asociada (opcional). Se valida que pertenezca a la misma cuenta.
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
