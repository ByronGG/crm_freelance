import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

// Módulo deals: oportunidades de venta y su avance por el pipeline.
// Importa ContactsModule para validar el contacto asociado vía su servicio y
// NotificationsModule para avisar de los cambios de etapa.
// Expone DealsService para que projects (oportunidad ganada → proyecto) y
// proposals lo consuman después.
@Module({
  imports: [ContactsModule, NotificationsModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
