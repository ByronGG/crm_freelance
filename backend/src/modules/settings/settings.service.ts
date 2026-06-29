import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CompanyProfile, Setting } from '../../generated/prisma/client';
import { UpsertCompanyProfileDto } from './dto/upsert-company-profile.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';

/**
 * Configuración de la cuenta: perfil de empresa (uno por usuario) y ajustes
 * clave/valor. Todo aislado por ownerId.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Perfil de empresa del usuario (o null si aún no lo ha configurado). */
  getCompanyProfile(ownerId: string): Promise<CompanyProfile | null> {
    return this.prisma.companyProfile.findUnique({ where: { ownerId } });
  }

  /** Crea o actualiza el perfil de empresa (único por usuario). */
  upsertCompanyProfile(
    ownerId: string,
    dto: UpsertCompanyProfileDto,
  ): Promise<CompanyProfile> {
    return this.prisma.companyProfile.upsert({
      where: { ownerId },
      create: { ownerId, ...dto },
      update: dto,
    });
  }

  listSettings(ownerId: string): Promise<Setting[]> {
    return this.prisma.setting.findMany({
      where: { ownerId },
      orderBy: { key: 'asc' },
    });
  }

  async getSetting(ownerId: string, key: string): Promise<Setting> {
    const setting = await this.prisma.setting.findUnique({
      where: { ownerId_key: { ownerId, key } },
    });
    if (!setting) {
      throw new NotFoundException('Ajuste no encontrado');
    }
    return setting;
  }

  upsertSetting(
    ownerId: string,
    key: string,
    dto: UpsertSettingDto,
  ): Promise<Setting> {
    return this.prisma.setting.upsert({
      where: { ownerId_key: { ownerId, key } },
      create: { ownerId, key, value: dto.value },
      update: { value: dto.value },
    });
  }

  async deleteSetting(ownerId: string, key: string): Promise<void> {
    await this.getSetting(ownerId, key);
    await this.prisma.setting.delete({
      where: { ownerId_key: { ownerId, key } },
    });
  }
}
