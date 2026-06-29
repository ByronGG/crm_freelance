import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Parámetros del reporte de ingresos por mes. */
export class IncomeReportDto {
  // Número de meses hacia atrás a incluir (por defecto 6).
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'months debe ser un entero' })
  @Min(1)
  @Max(24)
  months?: number;
}
