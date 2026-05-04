/*
  Warnings:

  - You are about to drop the column `parentLocationId` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "parentLocationId";

-- DropTable
DROP TABLE "AuditLog";
