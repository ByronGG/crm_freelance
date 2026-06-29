import { PartialType } from '@nestjs/swagger';

import { CreateActivityDto } from './create-activity.dto';

/** Actualización parcial de una actividad. */
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
