import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { SettingsModule } from '../settings/settings.module';
import { ProposalTemplatesController } from './proposal-templates.controller';
import { ProposalTemplatesService } from './proposal-templates.service';
import { ProposalsController } from './proposals.controller';
import { ProposalsScheduler } from './proposals.scheduler';
import { ProposalsService } from './proposals.service';

// Módulo proposals: propuestas/cotizaciones con ítems y total calculado, más
// las plantillas reutilizables. Importa ContactsModule y DealsModule para
// validar el contacto/oportunidad, SettingsModule para el perfil del PDF,
// NotificationsModule para el aviso de seguimiento, y ProjectsModule para la
// conversión Propuesta aceptada → Proyecto (la dependencia va en un solo
// sentido: proposals → projects, nunca al revés, para no crear un ciclo).
@Module({
  imports: [
    ContactsModule,
    DealsModule,
    SettingsModule,
    NotificationsModule,
    ProjectsModule,
  ],
  controllers: [ProposalsController, ProposalTemplatesController],
  providers: [ProposalsService, ProposalsScheduler, ProposalTemplatesService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
