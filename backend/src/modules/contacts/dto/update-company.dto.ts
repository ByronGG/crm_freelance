import { PartialType } from '@nestjs/swagger';

import { CreateCompanyDto } from './create-company.dto';

/** Actualización parcial de una empresa: todos los campos opcionales. */
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
