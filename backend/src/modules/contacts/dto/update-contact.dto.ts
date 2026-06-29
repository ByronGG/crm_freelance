import { PartialType } from '@nestjs/swagger';

import { CreateContactDto } from './create-contact.dto';

/** Actualización parcial de un contacto: todos los campos opcionales. */
export class UpdateContactDto extends PartialType(CreateContactDto) {}
