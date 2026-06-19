const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('All users:');
  users.forEach(u => {
    console.log(`- ${u.username} (role: ${u.role})`);
  });
}
main().finally(() => prisma.$disconnect());
