import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { IncomeReportDto } from './dto/income-report.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Conversión del pipeline. */
  @Get('pipeline')
  pipeline(@CurrentUser('accountId') ownerId: string) {
    return this.reports.getPipeline(ownerId);
  }

  /** Ingresos por mes (?months=N, por defecto 6). */
  @Get('income-by-month')
  incomeByMonth(
    @CurrentUser('accountId') ownerId: string,
    @Query() query: IncomeReportDto,
  ) {
    return this.reports.getIncomeByMonth(ownerId, query.months);
  }
}
