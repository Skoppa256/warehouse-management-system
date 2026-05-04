/*
  Warnings:

  - A unique constraint covering the columns `[batchNumber,productId,sectionId]` on the table `ProductBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductBatch_batchNumber_productId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductBatch_batchNumber_productId_sectionId_key" ON "ProductBatch"("batchNumber", "productId", "sectionId");
