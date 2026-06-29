import { PartialType } from '@nestjs/swagger';

import { CreateTaskDto } from './create-task.dto';

/** Actualización parcial de una tarea (incluye marcar como hecha/pendiente). */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
