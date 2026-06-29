import { PartialType } from '@nestjs/swagger';

import { CreateTagDto } from './create-tag.dto';

/** Actualización parcial de una etiqueta. */
export class UpdateTagDto extends PartialType(CreateTagDto) {}
