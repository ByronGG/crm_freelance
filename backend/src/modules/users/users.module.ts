import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Módulo users: gestión de usuarios, roles y equipo (modo agencia).
// Expone UsersService para que auth lo consuma (registro / login).
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
