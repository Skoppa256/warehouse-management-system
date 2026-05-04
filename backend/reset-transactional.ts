// scripts/reset-transactional.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // deepest children first
  await prisma.stockMovement.deleteMany(); // depends on batches, lines, etc.
  await prisma.shipmentLine?.deleteMany(); // if you have this model
  await prisma.goodsReceiptLine.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();

  await prisma.shipment.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrder.deleteMany();

  // inventory depends on ProductBatch
  await prisma.inventory.deleteMany();
  await prisma.productBatch.deleteMany();

  // you KEEP: user, supplier, product, customer, location, section, etc.
}

main()
  .then(() => console.log("Transactional data cleared"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
