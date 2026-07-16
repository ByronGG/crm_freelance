-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "proposalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
