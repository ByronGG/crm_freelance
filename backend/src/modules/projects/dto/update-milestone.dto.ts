import { PartialType } from '@nestjs/swagger';

import { CreateMilestoneDto } from './create-milestone.dto';

/** Actualización parcial de un hito. */
export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {}
