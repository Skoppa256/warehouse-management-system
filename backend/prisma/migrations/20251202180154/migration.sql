/*
  Warnings:

  - You are about to drop the column `quantity` on the `ProductBatch` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `ProductBatch` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `fromSectionId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `toSectionId` on the `StockMovement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[batchNumber,productId]` on the table `ProductBatch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,warehouseId]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warehouseId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SECTION', 'AISLE', 'RACK', 'SHELF', 'BIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('DAMAGE', 'LOSS', 'COUNT_CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('PURCHASE_ORDER', 'SALES_ORDER', 'SHIPMENT', 'GOODS_RECEIPT', 'STOCK_ADJUSTMENT', 'CYCLE_COUNT', 'MANUAL');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('PRODUCT', 'PRODUCT_BATCH', 'PURCHASE_ORDER', 'SALES_ORDER', 'SHIPMENT', 'STOCK_ADJUSTMENT', 'CYCLE_COUNT', 'OTHER');

-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'ADJUSTMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- DropForeignKey
ALTER TABLE "ProductBatch" DROP CONSTRAINT "ProductBatch_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_batchId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_fromSectionId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_toSectionId_fkey";

-- DropIndex
DROP INDEX "ProductBatch_batchNumber_productId_sectionId_key";

-- DropIndex
DROP INDEX "ProductBatch_sectionId_idx";

-- DropIndex
DROP INDEX "Section_code_key";

-- DropIndex
DROP INDEX "StockMovement_fromSectionId_idx";

-- DropIndex
DROP INDEX "StockMovement_toSectionId_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "uom" TEXT;

-- AlterTable
ALTER TABLE "ProductBatch" DROP COLUMN "quantity",
DROP COLUMN "sectionId";

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "destination",
DROP COLUMN "fromSectionId",
DROP COLUMN "toSectionId",
ADD COLUMN     "fromLocationId" TEXT,
ADD COLUMN     "inventoryId" TEXT,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" "ReferenceType",
ADD COLUMN     "toLocationId" TEXT,
ALTER COLUMN "batchId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "sectionId" TEXT NOT NULL,
    "parentLocationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "receivedById" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentLine" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "fromLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShipmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "reason" TEXT,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleCount" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleCountLine" (
    "id" TEXT NOT NULL,
    "cycleCountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "locationId" TEXT NOT NULL,
    "expectedQty" INTEGER NOT NULL,
    "countedQty" INTEGER,

    CONSTRAINT "CycleCountLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshotLine" (
    "id" TEXT NOT NULL,
    "inventorySnapshotId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "InventorySnapshotLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_sectionId_key" ON "Location"("code", "sectionId");

-- CreateIndex
CREATE INDEX "Inventory_locationId_idx" ON "Inventory"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_batchId_locationId_key" ON "Inventory"("productId", "batchId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_receiptNumber_key" ON "GoodsReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBatch_batchNumber_productId_key" ON "ProductBatch"("batchNumber", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_warehouseId_key" ON "Section"("code", "warehouseId");

-- CreateIndex
CREATE INDEX "StockMovement_fromLocationId_idx" ON "StockMovement"("fromLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_toLocationId_idx" ON "StockMovement"("toLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_referenceType_referenceId_idx" ON "StockMovement"("referenceType", "referenceId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCount" ADD CONSTRAINT "CycleCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_cycleCountId_fkey" FOREIGN KEY ("cycleCountId") REFERENCES "CycleCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountLine" ADD CONSTRAINT "CycleCountLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_inventorySnapshotId_fkey" FOREIGN KEY ("inventorySnapshotId") REFERENCES "InventorySnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
