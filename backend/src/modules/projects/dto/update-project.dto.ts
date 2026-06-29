import { PartialType } from '@nestjs/swagger';

import { CreateProjectDto } from './create-project.dto';

/** Actualización parcial de un proyecto (incluye el cambio de estado). */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
