import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { ProposalsController } from './proposals.controller';
import { ProposalsScheduler } from './proposals.scheduler';
import { ProposalsService } from './proposals.service';

// Módulo proposals: propuestas/cotizaciones con ítems y total calculado.
// Importa ContactsModule y DealsModule para validar el contacto y la
// oportunidad asociados, SettingsModule para el perfil de empresa del PDF, y
// NotificationsModule para el aviso de seguimiento de propuestas enviadas.
@Module({
  imports: [ContactsModule, DealsModule, SettingsModule, NotificationsModule],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalsScheduler],
  exports: [ProposalsService],
})
export class ProposalsModule {}
