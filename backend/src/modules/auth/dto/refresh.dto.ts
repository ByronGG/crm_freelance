import { IsJWT } from 'class-validator';

/** Token de refresco para renovar el par de tokens. */
export class RefreshDto {
  @IsJWT({ message: 'El refresh token no es válido' })
  refreshToken: string;
}
