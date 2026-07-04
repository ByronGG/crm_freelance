import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateMemberDto } from './dto/create-member.dto';

/**
 * Gestión del equipo (modo agencia). Cualquier miembro autenticado puede ver
 * el equipo; solo el ADMIN puede dar de alta o quitar miembros (RolesGuard).
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Lista el equipo de la cuenta (ADMIN + miembros). */
  @Get()
  team(@CurrentUser('accountId') accountId: string) {
    return this.users.listTeam(accountId);
  }

  /** Da de alta un miembro en la cuenta. Solo ADMIN. */
  @Roles('ADMIN')
  @Post()
  create(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.users.createMember(accountId, dto);
  }

  /** Quita un miembro de la cuenta. Solo ADMIN. */
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('accountId') accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.removeMember(accountId, id);
  }
}
