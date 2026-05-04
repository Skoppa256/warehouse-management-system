/*
  Warnings:

  - A unique constraint covering the columns `[batchNumber,productId]` on the table `ProductBatch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProductBatch" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "fromSectionId" TEXT,
ADD COLUMN     "toSectionId" TEXT,
ALTER COLUMN "reason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ProductBatch_expiryDate_idx" ON "ProductBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "ProductBatch_productId_idx" ON "ProductBatch"("productId");

-- CreateIndex
CREATE INDEX "ProductBatch_sectionId_idx" ON "ProductBatch"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBatch_batchNumber_productId_key" ON "ProductBatch"("batchNumber", "productId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_fromSectionId_idx" ON "StockMovement"("fromSectionId");

-- CreateIndex
CREATE INDEX "StockMovement_toSectionId_idx" ON "StockMovement"("toSectionId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromSectionId_fkey" FOREIGN KEY ("fromSectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toSectionId_fkey" FOREIGN KEY ("toSectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
