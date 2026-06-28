import { Module } from '@nestjs/common';

// Módulo dashboard: lectura agregada de métricas para la pantalla de inicio.
// Consume los servicios públicos de otros módulos, nunca sus tablas.
@Module({})
export class DashboardModule {}
