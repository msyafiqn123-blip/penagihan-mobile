const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Generating hash for "12345678"...');
  const hashedPassword = await bcrypt.hash('12345678', 10);
  
  console.log('Updating KOLEKTOR passwords...');
  const result = await prisma.user.updateMany({
    where: {
      role: 'KOLEKTOR'
    },
    data: {
      password: hashedPassword
    }
  });

  console.log(`Successfully updated ${result.count} KOLEKTOR accounts with the new password.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
