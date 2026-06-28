import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DealsModule } from './modules/deals/deals.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TagsModule } from './modules/tags/tags.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // Configuración global desde .env (disponible en toda la app).
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting básico: 100 peticiones por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Acceso a datos (global).
    PrismaModule,

    // Módulos de dominio (monolito modular).
    AuthModule,
    UsersModule,
    ContactsModule,
    DealsModule,
    ProposalsModule,
    ProjectsModule,
    ActivitiesModule,
    InvoicesModule,
    TagsModule,
    FilesModule,
    NotificationsModule,
    SettingsModule,
    ReportsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica el rate limiting a todas las rutas.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
