/*
  Warnings:

  - You are about to drop the column `userId` on the `PurchaseOrder` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_userId_fkey";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "userId",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
