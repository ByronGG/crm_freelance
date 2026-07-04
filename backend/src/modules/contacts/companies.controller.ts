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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companies.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query('search') search?: string,
  ) {
    return this.companies.findAll(ownerId, search);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companies.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companies.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companies.remove(ownerId, id);
  }
}
