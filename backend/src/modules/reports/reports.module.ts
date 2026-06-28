import { Module } from '@nestjs/common';

// Módulo reports: lecturas agregadas y exportaciones (solo consulta).
// Consume los servicios públicos de otros módulos, nunca sus tablas.
@Module({})
export class ReportsModule {}
