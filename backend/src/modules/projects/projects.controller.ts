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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(ownerId, dto);
  }

  /** Convierte una oportunidad ganada en proyecto. */
  @Post('from-deal/:dealId')
  createFromDeal(
    @CurrentUser('accountId') ownerId: string,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ) {
    return this.projects.createFromDeal(ownerId, dealId);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: QueryProjectsDto,
  ) {
    return this.projects.findAll(ownerId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.remove(ownerId, id);
  }

  // ───────────────────────────── hitos ─────────────────────────────

  @Post(':id/milestones')
  addMilestone(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.projects.addMilestone(ownerId, id, dto);
  }

  @Patch(':id/milestones/:milestoneId')
  updateMilestone(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.projects.updateMilestone(ownerId, id, milestoneId, dto);
  }

  @Delete(':id/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMilestone(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.projects.removeMilestone(ownerId, id, milestoneId);
  }

  // ─────────────────────────── time-tracking ───────────────────────────

  /** Registra tiempo dedicado al proyecto. */
  @Post(':id/time')
  addTimeEntry(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.projects.addTimeEntry(ownerId, id, dto);
  }

  @Delete(':id/time/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTimeEntry(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.projects.removeTimeEntry(ownerId, id, entryId);
  }
}
