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
  Put,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProposalsService } from './proposals.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';
import { UpdateItemsDto } from './dto/update-items.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@ApiTags('proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposals.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: QueryProposalsDto,
  ) {
    return this.proposals.findAll(ownerId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposals.findOne(ownerId, id);
  }

  /** Descarga la propuesta en PDF. */
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { filename, buffer } = await this.proposals.generatePdf(ownerId, id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposals.update(ownerId, id, dto);
  }

  /** Reemplaza la lista de ítems y recalcula el total. */
  @Put(':id/items')
  replaceItems(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemsDto,
  ) {
    return this.proposals.replaceItems(ownerId, id, dto);
  }

  /** Cambia el estado: Borrador → Enviada → Aceptada/Rechazada. */
  @Patch(':id/status')
  changeStatus(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.proposals.changeStatus(ownerId, id, dto);
  }

  /** Convierte una propuesta aceptada en proyecto para su cliente. */
  @Post(':id/convert-to-project')
  convertToProject(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposals.convertToProject(ownerId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposals.remove(ownerId, id);
  }
}
