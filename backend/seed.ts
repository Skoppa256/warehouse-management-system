import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync('masters-export.json', 'utf8');
  const { users, suppliers, products, customers } = JSON.parse(raw);

  await prisma.user.createMany({ data: users });
  await prisma.supplier.createMany({ data: suppliers });
  await prisma.product.createMany({ data: products });
  await prisma.customer.createMany({ data: customers });

  console.log('Masters re-seeded from export.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
