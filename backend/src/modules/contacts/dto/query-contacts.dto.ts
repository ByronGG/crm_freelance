import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Filtros para listar contactos. */
export class QueryContactsDto {
  // Búsqueda libre por nombre, apellido o email.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  // Filtra por empresa asociada.
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
