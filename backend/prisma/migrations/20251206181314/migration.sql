-- AlterTable
ALTER TABLE "GoodsReceipt" ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedById" TEXT;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
