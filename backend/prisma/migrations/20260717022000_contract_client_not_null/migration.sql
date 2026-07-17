-- Fase "contract" del refactor de integridad relacional: el eje cliente pasa a
-- NOT NULL. Requiere cero filas sin cliente; la fase expand
-- (20260716012256_relational_integrity_backfill) dejó las columnas nullable.

-- Re-derivación idempotente: la factura hereda el cliente de su proyecto (por si
-- alguna quedó sin él tras reasignar el cliente del proyecto, ya que está
-- denormalizado y no se actualiza solo).
UPDATE "Invoice" AS i
SET "contactId" = p."contactId"
FROM "Project" AS p
WHERE i."projectId" = p."id"
  AND i."contactId" IS NULL
  AND p."contactId" IS NOT NULL;

-- Guarda: aborta con un mensaje útil si aún quedan filas sin cliente, en vez de
-- fallar con un error opaco de Postgres al poner NOT NULL (protege producción).
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

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_contactId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "contactId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "contactId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "contactId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
