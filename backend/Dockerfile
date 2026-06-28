# Imagen de desarrollo del backend NestJS.
FROM node:24-alpine

WORKDIR /app

# Instala dependencias primero para aprovechar la caché de capas.
COPY package*.json ./
RUN npm install

# Copia el resto del código y genera el cliente Prisma.
COPY . .
RUN npx prisma generate

EXPOSE 3000

# Aplica migraciones pendientes y arranca en modo desarrollo (hot reload).
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]
