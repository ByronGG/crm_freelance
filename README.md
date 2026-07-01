# CRM para Freelancers y Agencias

Monorepo de un CRM orientado a freelancers y pequeñas agencias de software,
construido como **monolito modular**: un solo despliegue y una sola base de
datos, con el código dividido en módulos de dominio de fronteras estrictas.

## Stack

| Capa        | Tecnología                                   |
| ----------- | -------------------------------------------- |
| Backend     | NestJS 11 + TypeScript                       |
| ORM / BD    | Prisma 7 (driver adapter `pg`) + PostgreSQL  |
| Auth        | JWT access + refresh (passport-jwt)          |
| Seguridad   | Helmet · CORS restringido · rate limiting · validación DTO |
| Frontend    | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Datos (cli) | TanStack Query + Axios                       |
| Infra local | Docker + docker-compose                      |

## Estructura

```text
crm_freelance/
├── backend/      # API NestJS (monolito modular)
│   ├── src/
│   │   ├── modules/      # un módulo por dominio (auth, contacts, deals, …)
│   │   ├── common/       # guards, decorators compartidos
│   │   ├── prisma/       # PrismaService (global)
│   │   └── generated/    # cliente Prisma generado (ignorado por git)
│   └── prisma/schema.prisma
├── frontend/     # SPA React + Vite + Tailwind
│   └── src/
│       ├── features/     # una carpeta por dominio (espeja el backend)
│       ├── components/   # UI y layout compartidos
│       └── lib/          # cliente axios, query client, tema
└── docker-compose.yml
```

## Módulos

Los 14 módulos de dominio están montados en el backend:

`auth` · `users` · `contacts` · `deals` · `proposals` · `projects` ·
`activities` · `invoices` · `tags` · `files` · `notifications` ·
`settings` · `reports` · `dashboard`

El frontend cuenta con páginas para: dashboard, contactos, oportunidades
(tablero), propuestas, proyectos, tareas, facturas y configuración.

> **Regla de fronteras:** un módulo nunca consulta las tablas de otro; pide la
> información al servicio público del módulo dueño (patrón `assertOwned`).

## Puesta en marcha (desarrollo local)

### 1. Base de datos

Con Docker (Postgres queda en el puerto **5433** del host para no chocar con un
Postgres local en el 5432):

```bash
docker compose up -d db
```

O usa cualquier PostgreSQL y ajusta `DATABASE_URL` en `backend/.env`.

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajusta secretos JWT y DATABASE_URL
npm install
npx prisma generate         # genera el cliente en src/generated/prisma
npx prisma migrate dev      # crea las tablas a partir del esquema
npm run start:dev           # API en http://localhost:3000/api
```

- Salud: `GET http://localhost:3000/api/health`
- Docs (Swagger): `http://localhost:3000/api/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # SPA en http://localhost:5173
```

Vite hace proxy de `/api` al backend en el puerto 3000.

### Todo con Docker

```bash
docker compose up --build   # db + backend + frontend
```

## Scripts útiles

| Ámbito   | Comando                | Descripción                             |
| -------- | ---------------------- | --------------------------------------- |
| backend  | `npm run start:dev`    | API con hot-reload                      |
| backend  | `npm run build`        | Compila a `dist/`                       |
| backend  | `npm run lint`         | ESLint (`--fix`)                        |
| backend  | `npm test`             | Jest (`npm test -- contacts` para filtrar) |
| backend  | `npx prisma migrate dev` | Aplica/crea migraciones               |
| backend  | `npx prisma studio`    | Explorador de datos                     |
| frontend | `npm run dev`          | Servidor de desarrollo Vite             |
| frontend | `npm run build`        | `tsc -b && vite build`                  |
| frontend | `npm run lint`         | **oxlint** (no ESLint)                  |

## Convenciones

- Código (variables, clases, endpoints) en **inglés**; comentarios y UI en **español**.
- Cada módulo NestJS: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
- Sin lógica de negocio en los controladores; sin acceso directo a tablas de otro módulo.
- Toda entrada se valida con DTOs + class-validator.
- Aislamiento por cuenta: cada consulta filtra por `ownerId` (tomado del JWT).
- Orden de implementación del MVP: `auth → contacts → deals → proposals → projects → activities → invoices → resto`.
