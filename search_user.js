const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { username: { contains: 'BBC' } }
  });
  console.log(users);
}
main().finally(() => prisma.$disconnect());
