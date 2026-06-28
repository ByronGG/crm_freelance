import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Todas las rutas se sirven bajo /api.
  app.setGlobalPrefix('api');

  // Cabeceras de seguridad.
  app.use(helmet());

  // CORS restringido al origen del frontend.
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // Validación de entrada en todos los endpoints.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // rechaza propiedades desconocidas
      transform: true, // convierte payloads a instancias de DTO
    }),
  );

  // Documentación OpenAPI en /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CRM Freelancers API')
    .setDescription('API REST del CRM para freelancers y agencias.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
