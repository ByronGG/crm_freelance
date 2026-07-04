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
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contacts.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: QueryContactsDto,
  ) {
    return this.contacts.findAll(ownerId, query);
  }

  /** Exporta los contactos de la cuenta a CSV. Antes de :id para no colisionar. */
  @Get('export.csv')
  async exportCsv(
    @CurrentUser('accountId') ownerId: string,
  ): Promise<StreamableFile> {
    const csv = await this.contacts.exportCsv(ownerId);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="contactos.csv"',
    });
  }

  /** Importa contactos desde un CSV (texto en el cuerpo). */
  @Post('import')
  importCsv(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: ImportContactsDto,
  ) {
    return this.contacts.importCsv(ownerId, dto.csv);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contacts.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contacts.remove(ownerId, id);
  }
}
