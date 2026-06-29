import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TagsService } from './tags.service';
import { ApplyTagDto } from './dto/apply-tag.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TaggableType } from '../../generated/prisma/client';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Post()
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateTagDto) {
    return this.tags.create(ownerId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') ownerId: string) {
    return this.tags.findAll(ownerId);
  }

  /** Etiquetas aplicadas a una entidad (contacto u oportunidad). */
  @Get('entity/:entityType/:entityId')
  listForEntity(
    @CurrentUser('id') ownerId: string,
    @Param('entityType') entityType: TaggableType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.tags.listForEntity(ownerId, entityType, entityId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tags.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tags.remove(ownerId, id);
  }

  /** Aplica la etiqueta a una entidad. */
  @Post(':id/apply')
  @HttpCode(HttpStatus.NO_CONTENT)
  apply(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyTagDto,
  ) {
    return this.tags.apply(ownerId, id, dto);
  }

  /** Quita la etiqueta de una entidad. */
  @Delete(':id/apply')
  @HttpCode(HttpStatus.NO_CONTENT)
  unapply(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyTagDto,
  ) {
    return this.tags.unapply(ownerId, id, dto);
  }
}
