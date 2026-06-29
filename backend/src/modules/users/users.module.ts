import { Module } from '@nestjs/common';

import { UsersService } from './users.service';

// Módulo users: gestión de usuarios y roles.
// Expone UsersService para que auth lo consuma (registro / login).
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
