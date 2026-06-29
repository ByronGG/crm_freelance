import { Module } from '@nestjs/common';

import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

// Módulo settings: perfil de empresa y ajustes clave/valor por usuario.
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
