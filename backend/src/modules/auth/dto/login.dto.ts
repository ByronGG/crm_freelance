import { IsEmail, IsString, MinLength } from 'class-validator';

/** Credenciales para iniciar sesión. */
export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
