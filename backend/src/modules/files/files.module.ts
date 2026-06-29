import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { ProjectsModule } from '../projects/projects.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

// Módulo files: adjuntos en contactos, oportunidades y proyectos.
// Importa los módulos dueños para validar la entidad a la que se adjunta.
@Module({
  imports: [ContactsModule, DealsModule, ProjectsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
