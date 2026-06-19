const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({where: {role: 'KELURAHAN'}});
  console.log('Deleted KELURAHAN');
}
main().finally(() => prisma.$disconnect());
