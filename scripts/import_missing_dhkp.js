const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Loading DHKP excel file...');
  const workbook = XLSX.readFile('C:\\\\Users\\\\msyaf\\\\Downloads\\\\DHKP 17-6-26.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  // Clean keys
  const cleanedData = rawData.map(row => {
    const newRow = {};
    for (let key in row) {
      newRow[key.trim()] = row[key];
    }
    return newRow;
  });

  // Get all kelurahan in DB
  const dbRecords = await prisma.taxRecord.findMany({
    select: { nm_kelurahan: true },
    distinct: ['nm_kelurahan']
  });
  const dbKelurahans = new Set(dbRecords.map(r => r.nm_kelurahan));
  
  // Find missing rows from rawData
  const missingRows = cleanedData.filter(row => row.nm_kelurahan && !dbKelurahans.has(row.nm_kelurahan));
  console.log(`Found ${missingRows.length} rows belonging to missing kelurahans.`);

  const missingKelurahansSet = new Set(missingRows.map(r => r.nm_kelurahan));
  const missingKelurahans = Array.from(missingKelurahansSet);

  console.log('Missing Kelurahans:', missingKelurahans);

  // Insert missing rows into DB
  if (missingRows.length > 0) {
    console.log('Inserting into TaxRecord in chunks...');
    const chunkSize = 5000;
    for (let i = 0; i < missingRows.length; i += chunkSize) {
      const chunk = missingRows.slice(i, i + chunkSize).map(row => ({
        nm_kecamatan: row.nm_kecamatan,
        nm_kelurahan: row.nm_kelurahan,
        blok: row.nop ? String(row.nop).trim().substring(10, 13) : '000',
        nop: String(row.nop).trim(),
        nm_wp: row.nm_wp,
        alamat_op: row.alamat_op,
        luas_bumi_sppt: parseFloat(row.luas_bumi_sppt) || 0,
        luas_bng_sppt: parseFloat(row.luas_bng_sppt) || 0,
        pbb_yg_harus_dibayar_sppt: parseFloat(row.pbb_yg_harus_dibayar_sppt) || 0,
        status_pembayaran_sppt: row.status_pembayaran_sppt || 'BELUM LUNAS'
      }));
      await prisma.taxRecord.createMany({ data: chunk });
    }
    console.log('Finished inserting tax records.');
  }

  // Create accounts
  const allKolektors = await prisma.user.findMany({
    where: { role: { in: ['KOLEKTOR', 'PENAGIHAN'] } }
  });

  const hashedPassword = await bcrypt.hash('12345678', 10);
  let createdCount = 0;

  for (const row of missingRows) {
    // Only process one per kelurahan to create account
    if (missingKelurahansSet.has(row.nm_kelurahan)) {
      missingKelurahansSet.delete(row.nm_kelurahan); // Mark as processed
      
      const peer = allKolektors.find(u => u.nm_kecamatan === row.nm_kecamatan && u.username && u.username.includes('_'));
      let singkatan = 'UNKNOWN';
      if (peer) {
        const parts = peer.username.split('_');
        singkatan = parts[parts.length - 1];
      }

      const baseName = row.nm_kelurahan.trim().replace(/\s+/g, '').toUpperCase();
      const expectedUsername = `${baseName}_${singkatan}`;

      try {
        await prisma.user.create({
          data: {
            username: expectedUsername,
            password: hashedPassword,
            role: 'KOLEKTOR',
            nm_kecamatan: row.nm_kecamatan,
            nm_kelurahan: row.nm_kelurahan
          }
        });
        console.log(`Created account: ${expectedUsername} untuk ${row.nm_kelurahan}`);
        createdCount++;
      } catch (e) {
        console.error(`Failed creating account ${expectedUsername}:`, e.message);
      }
    }
  }
  
  console.log(`Created ${createdCount} accounts.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
