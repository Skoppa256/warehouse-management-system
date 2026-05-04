/*
  Warnings:

  - The values [PENDING] on the enum `ShipmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `adjustmentType` on the `StockAdjustment` table. All the data in the column will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CycleCount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CycleCountLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventorySnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventorySnapshotLine` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShipmentStatus_new" AS ENUM ('DRAFT', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."Shipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shipment" ALTER COLUMN "status" TYPE "ShipmentStatus_new" USING ("status"::text::"ShipmentStatus_new");
ALTER TYPE "ShipmentStatus" RENAME TO "ShipmentStatus_old";
ALTER TYPE "ShipmentStatus_new" RENAME TO "ShipmentStatus";
DROP TYPE "public"."ShipmentStatus_old";
ALTER TABLE "Shipment" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "CycleCount" DROP CONSTRAINT "CycleCount_createdById_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_cycleCountId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_locationId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_productId_fkey";

-- DropForeignKey
ALTER TABLE "CycleCountLine" DROP CONSTRAINT "CycleCountLine_stockAdjustmentId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_batchId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_inventorySnapshotId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_locationId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySnapshotLine" DROP CONSTRAINT "InventorySnapshotLine_productId_fkey";

-- AlterTable
ALTER TABLE "StockAdjustment" DROP COLUMN "adjustmentType";

-- DropTable
DROP TABLE "Attachment";

-- DropTable
DROP TABLE "CycleCount";

-- DropTable
DROP TABLE "CycleCountLine";

-- DropTable
DROP TABLE "InventorySnapshot";

-- DropTable
DROP TABLE "InventorySnapshotLine";

-- DropEnum
DROP TYPE "AdjustmentType";
