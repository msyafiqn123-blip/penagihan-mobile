const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const records = await prisma.taxRecord.groupBy({
    by: ['nm_kecamatan', 'nm_kelurahan']
  });

  const kolektors = await prisma.user.findMany({
    where: { role: 'KOLEKTOR' }
  });

  const kolektorKeys = new Set(kolektors.map(k => `${k.nm_kecamatan.trim()}_${k.nm_kelurahan.trim()}`));

  const missing = records.filter(r => !kolektorKeys.has(`${r.nm_kecamatan.trim()}_${r.nm_kelurahan.trim()}`));

  console.log('Total Kelurahan from TaxRecord:', records.length);
  console.log('Total Kolektor Accounts:', kolektors.length);
  console.log(`Missing Kolektor for ${missing.length} kelurahan:`);
  console.log(missing);

  if (missing.length > 0) {
    console.log('\nCreating missing accounts...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    let createdCount = 0;
    for (const m of missing) {
      // Find a user in the same kecamatan to extract the singkatan
      const peer = kolektors.find(u => u.nm_kecamatan === m.nm_kecamatan && u.username && u.username.includes('_'));
      let singkatan = 'UNKNOWN';
      if (peer) {
        const parts = peer.username.split('_');
        singkatan = parts[parts.length - 1];
      }

      const baseName = m.nm_kelurahan.trim().replace(/\s+/g, '').toUpperCase();
      const expectedUsername = `${baseName}_${singkatan}`;

      try {
        await prisma.user.create({
          data: {
            username: expectedUsername,
            password: hashedPassword,
            role: 'KOLEKTOR',
            nm_kecamatan: m.nm_kecamatan,
            nm_kelurahan: m.nm_kelurahan
          }
        });
        console.log(`Created: ${expectedUsername} untuk ${m.nm_kelurahan}`);
        createdCount++;
      } catch (e) {
        console.error(`Failed creating ${expectedUsername}:`, e.message);
      }
    }
    console.log(`Successfully created ${createdCount} accounts.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
