import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

// Módulo deals: oportunidades de venta y su avance por el pipeline.
// Importa ContactsModule para validar el contacto asociado vía su servicio.
// Expone DealsService para que projects (oportunidad ganada → proyecto) y
// proposals lo consuman después.
@Module({
  imports: [ContactsModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
