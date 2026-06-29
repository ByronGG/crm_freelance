import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { QueryAttachmentsDto } from './dto/query-attachments.dto';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /** Registra un adjunto (metadatos + URL). */
  @Post()
  create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.files.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') ownerId: string,
    @Query() query: QueryAttachmentsDto,
  ) {
    return this.files.findAll(ownerId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.files.findOne(ownerId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.files.remove(ownerId, id);
  }
}
