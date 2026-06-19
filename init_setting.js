const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'LAST_UPDATE_LUNAS' },
    update: { value: new Date().toISOString() },
    create: { key: 'LAST_UPDATE_LUNAS', value: new Date().toISOString() }
  });
  console.log('Done');
}
main().finally(() => prisma.$disconnect());
