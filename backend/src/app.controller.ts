import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Endpoint de salud para verificar que la API está en pie.
  @Get()
  health() {
    return this.appService.health();
  }
}
