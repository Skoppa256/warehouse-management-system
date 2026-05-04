/*
  Warnings:

  - The values [AISLE,RACK,SHELF] on the enum `LocationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `warehouseId` on the `CycleCount` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `GoodsReceipt` table. All the data in the column will be lost.
  - The `status` column on the `GoodsReceipt` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `warehouseId` on the `InventorySnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the `Warehouse` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `CycleCountLine` table without a default value. This is not possible if the table is not empty.
  - Made the column `batchId` on table `CycleCountLine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `GoodsReceiptLine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `Inventory` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `inventoryId` to the `InventorySnapshotLine` table without a default value. This is not possible if the table is not empty.
  - Made the column `batchId` on table `InventorySnapshotLine` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `uom` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `batchId` on table `ShipmentLine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `StockAdjustment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `StockMovement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `code` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UOM" AS ENUM ('PCS', 'BOX', 'BOTTLE', 'G', 'ML');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'PENDING', 'RECEIVED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "LocationType_new" AS ENUM ('SECTION', 'BIN');
ALTER TABLE "Location" ALTER COLUMN "type" TYPE "LocationType_new" USING ("type"::text::"LocationType_new");
ALTER TYPE "LocationType" RENAME TO "LocationType_old";
ALTER TYPE "LocationType_new" RENAME TO "LocationType";
DROP TYPE "public"."LocationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CycleCount" DROP CONSTRAINT "CycleCount_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceipt" DROP CONSTRAINT "GoodsReceipt_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptLine" DROP CONSTRAINT "GoodsReceiptLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_batchId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshot" DROP CONSTRAINT "InventorySnapshot_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_parentLocationId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrder" DROP CONSTRAINT "SalesOrder_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "ShipmentLine" DROP CONSTRAINT "ShipmentLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustment" DROP CONSTRAINT "StockAdjustment_batchId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_batchId_fkey";

-- DropIndex
DROP INDEX "Section_code_warehouseId_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "CycleCount" DROP COLUMN "warehouseId",
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "CycleCountLine" ADD COLUMN     "difference" INTEGER,
ADD COLUMN     "inventoryId" TEXT NOT NULL,
ADD COLUMN     "stockAdjustmentId" TEXT,
ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "GoodsReceipt" DROP COLUMN "warehouseId",
DROP COLUMN "status",
ADD COLUMN     "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "GoodsReceiptLine" ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventorySnapshot" DROP COLUMN "warehouseId",
ALTER COLUMN "snapshotDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "InventorySnapshotLine" ADD COLUMN     "inventoryId" TEXT NOT NULL,
ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "uom",
ADD COLUMN     "uom" "UOM" NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "warehouseId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "warehouseId",
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "warehouseId";

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "warehouseId",
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ShipmentLine" ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockAdjustment" ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "Warehouse";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCount" ADD CONSTRAINT "CycleCount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_stockAdjustmentId_fkey" FOREIGN KEY ("stockAdjustmentId") REFERENCES "StockAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
