-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttachableType" ADD VALUE 'PROPOSAL';
ALTER TYPE "AttachableType" ADD VALUE 'INVOICE';

-- AlterEnum
ALTER TYPE "TaggableType" ADD VALUE 'PROJECT';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "contactId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "contactId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "projectId" TEXT;

-- Backfill: el proyecto hereda el cliente de su oportunidad de origen.
-- Solo aplica a proyectos que derivan de un deal con contacto asignado; los
-- proyectos sueltos quedan con contactId NULL (se exige cliente en escrituras
-- nuevas desde la capa de servicio y se muestran como "sin cliente" en la UI).
UPDATE "Project" AS p
SET "contactId" = d."contactId"
FROM "Deal" AS d
WHERE p."dealId" = d."id"
  AND p."contactId" IS NULL
  AND d."contactId" IS NOT NULL;

-- Backfill: la factura hereda el cliente de su proyecto (tras poblar el proyecto).
UPDATE "Invoice" AS i
SET "contactId" = p."contactId"
FROM "Project" AS p
WHERE i."projectId" = p."id"
  AND i."contactId" IS NULL
  AND p."contactId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_projectId_idx" ON "Activity"("projectId");

-- CreateIndex
CREATE INDEX "Invoice_contactId_idx" ON "Invoice"("contactId");

-- CreateIndex
CREATE INDEX "Project_contactId_idx" ON "Project"("contactId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
