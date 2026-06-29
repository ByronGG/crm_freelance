import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpsertCompanyProfileDto } from './dto/upsert-company-profile.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Las rutas de perfil de empresa van antes de las de :key para no chocar.

  @Get('company-profile')
  getCompanyProfile(@CurrentUser('id') ownerId: string) {
    return this.settings.getCompanyProfile(ownerId);
  }

  @Put('company-profile')
  upsertCompanyProfile(
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpsertCompanyProfileDto,
  ) {
    return this.settings.upsertCompanyProfile(ownerId, dto);
  }

  @Get()
  listSettings(@CurrentUser('id') ownerId: string) {
    return this.settings.listSettings(ownerId);
  }

  @Get(':key')
  getSetting(
    @CurrentUser('id') ownerId: string,
    @Param('key') key: string,
  ) {
    return this.settings.getSetting(ownerId, key);
  }

  @Put(':key')
  upsertSetting(
    @CurrentUser('id') ownerId: string,
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
  ) {
    return this.settings.upsertSetting(ownerId, key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSetting(
    @CurrentUser('id') ownerId: string,
    @Param('key') key: string,
  ) {
    return this.settings.deleteSetting(ownerId, key);
  }
}
