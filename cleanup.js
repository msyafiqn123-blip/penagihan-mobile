const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res1 = await prisma.taxRecord.deleteMany({
    where: { nm_kecamatan: { contains: 'OBJEK KHUSUS' } }
  });
  console.log('Deleted OBJEK KHUSUS (kecamatan):', res1.count);

  const res1b = await prisma.taxRecord.deleteMany({
    where: { nm_kelurahan: { contains: 'OBJEK KHUSUS' } }
  });
  console.log('Deleted OBJEK KHUSUS (kelurahan):', res1b.count);

  const res2 = await prisma.taxRecord.deleteMany({
    where: { pbb_yg_harus_dibayar_sppt: { gt: 2000000 } }
  });
  console.log('Deleted > 2jt:', res2.count);
}

main().finally(() => prisma.$disconnect());
