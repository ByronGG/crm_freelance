import { Module } from '@nestjs/common';

import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

// Módulo contacts: dueño de las entidades Contact y Company.
// Expone sus servicios para que otros módulos (deals, proposals…) consulten
// contactos/empresas a través de ellos, nunca accediendo a sus tablas.
@Module({
  controllers: [ContactsController, CompaniesController],
  providers: [ContactsService, CompaniesService],
  exports: [ContactsService, CompaniesService],
})
export class ContactsModule {}
