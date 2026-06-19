const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.taxRecord.count();
  console.log('Rows in DB:', count);
}
main().finally(() => prisma.$disconnect());
