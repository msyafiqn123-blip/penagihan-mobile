const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'KOLEKTOR' }
  });
  console.log('Total KOLEKTOR accounts:', users.length);
}
main().finally(() => prisma.$disconnect());
