# CRM para Freelancers y Agencias

Monorepo de un CRM orientado a freelancers y pequeñas agencias de software,
construido como **monolito modular**.

## Stack

| Capa        | Tecnología                                   |
| ----------- | -------------------------------------------- |
| Backend     | NestJS + TypeScript                          |
| ORM / BD    | Prisma 7 (driver adapter `pg`) + PostgreSQL  |
| Auth        | JWT (passport-jwt) · class-validator         |
| Seguridad   | Helmet · CORS restringido · rate limiting    |
| Frontend    | React + Vite + TypeScript + Tailwind CSS v4  |
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
│       ├── components/
│       └── lib/          # cliente axios, query client
└── docker-compose.yml
```

## Puesta en marcha (desarrollo local)

### 1. Base de datos

Con Docker:

```bash
docker compose up -d db
```

O usa cualquier PostgreSQL local y ajusta `backend/.env`.

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajusta secretos y DATABASE_URL
npm install
npx prisma generate
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
docker compose up --build
```

## Convenciones

- Código (variables, clases, endpoints) en **inglés**; comentarios y UI en **español**.
- Cada módulo NestJS: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
- Sin lógica de negocio en los controladores; sin acceso directo a tablas de otro módulo.
- Toda entrada se valida con DTOs + class-validator.
- Orden de implementación del MVP: `auth → contacts → deals → proposals → projects → activities → invoices → resto`.
