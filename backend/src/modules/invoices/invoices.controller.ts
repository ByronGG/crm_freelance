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
import { InvoicesService } from './invoices.service';
import { ChangeInvoiceStatusDto } from './dto/change-invoice-status.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  /** Genera una factura a partir de un proyecto. */
  @Post()
  create(
    @CurrentUser('accountId') ownerId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoices.create(ownerId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: QueryInvoicesDto,
  ) {
    return this.invoices.findAll(ownerId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.findOne(ownerId, id);
  }

  /** Descarga la factura en PDF. */
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { filename, buffer } = await this.invoices.generatePdf(ownerId, id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Patch(':id')
  update(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(ownerId, id, dto);
  }

  /** Cambia el estado de cobro: Borrador → Emitida → Pagada → Vencida. */
  @Patch(':id/status')
  changeStatus(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeInvoiceStatusDto,
  ) {
    return this.invoices.changeStatus(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.remove(ownerId, id);
  }

  // ───────────────────────────── pagos ─────────────────────────────

  /** Registra un pago (total o parcial). */
  @Post(':id/payments')
  addPayment(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.invoices.addPayment(ownerId, id, dto);
  }

  @Delete(':id/payments/:paymentId')
  removePayment(
    @CurrentUser('accountId') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.invoices.removePayment(ownerId, id, paymentId);
  }
}
