import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

// Módulo tags: etiquetas reutilizables aplicadas a contactos y oportunidades.
// Importa ContactsModule y DealsModule para validar la entidad a etiquetar.
@Module({
  imports: [ContactsModule, DealsModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
