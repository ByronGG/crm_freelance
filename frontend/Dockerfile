# Imagen de desarrollo del frontend Vite + React.
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host expone el dev server fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host"]
