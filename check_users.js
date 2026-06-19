const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() { 
  const users = await prisma.user.findMany({ where: { role: 'KELURAHAN' }}); 
  console.log('Count:', users.length); 
} 
main().finally(() => prisma.$disconnect());
