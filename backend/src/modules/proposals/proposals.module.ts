import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

// Módulo proposals: propuestas/cotizaciones con ítems y total calculado.
// Importa ContactsModule y DealsModule para validar el contacto y la
// oportunidad asociados a través de sus servicios.
@Module({
  imports: [ContactsModule, DealsModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
