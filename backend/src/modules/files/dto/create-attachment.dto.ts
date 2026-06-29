import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { AttachableType } from '../../../generated/prisma/client';

/**
 * Registra un archivo adjunto (metadatos + URL). La subida real del binario
 * se hace fuera del MVP; aquí se guarda la referencia.
 */
export class CreateAttachmentDto {
  @IsString()
  @MinLength(1, { message: 'El nombre de archivo es obligatorio' })
  @MaxLength(255)
  filename: string;

  @IsString()
  @MinLength(1, { message: 'La URL es obligatoria' })
  @MaxLength(1000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsInt({ message: 'El tamaño debe ser un entero (bytes)' })
  @Min(0)
  size?: number;

  @IsEnum(AttachableType, { message: 'Tipo de entidad no válido' })
  entityType: AttachableType;

  @IsUUID()
  entityId: string;
}
