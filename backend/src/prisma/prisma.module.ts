import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global de acceso a datos. Se marca @Global para que cualquier
 * módulo de dominio pueda inyectar PrismaService sin reimportarlo.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
