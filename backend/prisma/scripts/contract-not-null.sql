-- ============================================================================
-- Migración "contract": NOT NULL en el eje cliente
-- ----------------------------------------------------------------------------
-- Cierra el refactor expand/contract de integridad relacional. La fase "expand"
-- (20260716012256_relational_integrity_backfill) añadió las columnas como
-- nullable + backfill; ésta las vuelve obligatorias en la BD.
--
-- REQUISITO: cero filas sin cliente. Ejecuta antes:
--   backend/prisma/scripts/sanitize-legacy-clients.sql
-- El PASO 2 de abajo aborta con un mensaje claro si aún quedan huérfanos.
--
-- CÓMO APLICARLA (no está en prisma/migrations todavía, a propósito: una
-- migración pendiente que falla deja el historial de Prisma en estado "failed"):
--   1. Sanea los datos y verifica que el reporte da 0/0/0.
--   2. Edita schema.prisma con los cambios del bloque "SCHEMA" de abajo.
--   3. mkdir backend/prisma/migrations/<timestamp>_contract_client_not_null
--   4. Copia este archivo ahí como migration.sql (sin esta cabecera).
--   5. npx prisma migrate deploy && npx prisma generate
-- ============================================================================


-- ─────────── PASO 1 · Re-derivar facturas (idempotente, por si acaso) ───────
UPDATE "Invoice" AS i
SET "contactId" = p."contactId"
FROM "Project" AS p
WHERE i."projectId" = p."id"
  AND i."contactId" IS NULL
  AND p."contactId" IS NOT NULL;


-- ─────────── PASO 2 · Guarda: aborta con mensaje útil si hay huérfanos ──────
DO $$
DECLARE
  proyectos  int;
  facturas   int;
  propuestas int;
BEGIN
  SELECT count(*) INTO proyectos  FROM "Project"  WHERE "contactId" IS NULL;
  SELECT count(*) INTO facturas   FROM "Invoice"  WHERE "contactId" IS NULL;
  SELECT count(*) INTO propuestas FROM "Proposal" WHERE "contactId" IS NULL;
  IF proyectos > 0 OR facturas > 0 OR propuestas > 0 THEN
    RAISE EXCEPTION
      'Quedan filas sin cliente (proyectos=%, facturas=%, propuestas=%). Ejecuta antes prisma/scripts/sanitize-legacy-clients.sql',
      proyectos, facturas, propuestas;
  END IF;
END $$;


-- ─────────── PASO 3 · Proposal: la FK pasa de SET NULL a RESTRICT ───────────
-- Una columna NOT NULL no puede recibir SET NULL al borrar el contacto, así que
-- la FK debe cambiar. Project e Invoice ya son RESTRICT desde la fase expand.
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_contactId_fkey";
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─────────────────────────── PASO 4 · NOT NULL ──────────────────────────────
ALTER TABLE "Project"  ALTER COLUMN "contactId" SET NOT NULL;
ALTER TABLE "Invoice"  ALTER COLUMN "contactId" SET NOT NULL;
ALTER TABLE "Proposal" ALTER COLUMN "contactId" SET NOT NULL;


-- ============================================================================
-- SCHEMA · cambios que deben ir en prisma/schema.prisma EN EL MISMO commit
-- (si no, Prisma detecta drift entre el esquema y la BD)
-- ----------------------------------------------------------------------------
-- model Project:
--   - contact   Contact? @relation(fields: [contactId], references: [id], onDelete: Restrict)
--   - contactId String?
--   + contact   Contact  @relation(fields: [contactId], references: [id], onDelete: Restrict)
--   + contactId String
--
-- model Invoice:
--   - contact   Contact? @relation(fields: [contactId], references: [id], onDelete: Restrict)
--   - contactId String?
--   + contact   Contact  @relation(fields: [contactId], references: [id], onDelete: Restrict)
--   + contactId String
--
-- model Proposal:
--   - contact   Contact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
--   - contactId String?
--   + contact   Contact  @relation(fields: [contactId], references: [id], onDelete: Restrict)
--   + contactId String
--
-- Nota: Deal.contactId se queda OPCIONAL a propósito (el pipeline quedó
-- desacoplado por decisión de producto).
--
-- Tras `prisma generate`, estas comprobaciones defensivas quedan redundantes
-- (no rompen, pero se pueden limpiar):
--   - proposals.service.ts → convertToProject: `if (!proposal.contactId)`
--   - projects.service.ts  → getContactId devuelve `string` en vez de `string | null`
-- ============================================================================
