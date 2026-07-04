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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProposalTemplatesService } from './proposal-templates.service';
import { CreateProposalTemplateDto } from './dto/create-template.dto';

// Ruta propia para no colisionar con /proposals/:id.
@ApiTags('proposal-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposal-templates')
export class ProposalTemplatesController {
  constructor(private readonly templates: ProposalTemplatesService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateProposalTemplateDto,
  ) {
    return this.templates.create(ownerId, dto);
  }

  @Get()
  findAll(@CurrentUser('accountId') ownerId: string) {
    return this.templates.findAll(ownerId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.findOne(ownerId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.remove(ownerId, id);
  }
}
