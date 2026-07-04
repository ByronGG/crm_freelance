import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Datos para dar de alta un miembro (MEMBER) dentro de la cuenta. */
export class CreateMemberDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  password: string;
}
