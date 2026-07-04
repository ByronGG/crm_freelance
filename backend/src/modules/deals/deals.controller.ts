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
import { DealsService } from './deals.service';
import { ChangeStageDto } from './dto/change-stage.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { QueryDealsDto } from './dto/query-deals.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateDealDto,
  ) {
    return this.deals.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: QueryDealsDto,
  ) {
    return this.deals.findAll(ownerId, query);
  }

  /** Tablero Kanban: oportunidades agrupadas por etapa. */
  @Get('board')
  board(@CurrentUser('accountId') ownerId: string) {
    return this.deals.board(ownerId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deals.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.deals.update(ownerId, id, dto);
  }

  /** Cambia la etapa (mover la tarjeta en el Kanban). */
  @Patch(':id/stage')
  changeStage(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStageDto,
  ) {
    return this.deals.changeStage(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deals.remove(ownerId, id);
  }
}
