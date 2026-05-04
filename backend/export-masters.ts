import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const [users, suppliers, products, customers] = await Promise.all([
    prisma.user.findMany(),
    prisma.supplier.findMany(),
    prisma.product.findMany(),
    prisma.customer.findMany(),
  ]);

  const data = { users, suppliers, products, customers };

  const outPath = path.join(process.cwd(), 'masters-export.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

  console.log('Exported masters to', outPath);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
