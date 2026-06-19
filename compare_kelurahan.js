const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  // Read Excel
  console.log('Reading Excel...');
  const workbook = xlsx.readFile('C:\\Users\\msyaf\\Downloads\\kelurahan dan nop.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);
  
  const excelKecamatans = new Set();
  const excelKelurahans = new Set(); // To be safe, store "KECAMATAN - KELURAHAN"
  
  rawData.forEach(row => {
    // We don't know the exact column names, let's find them
    const getVal = (key) => {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      return foundKey ? String(row[foundKey]).trim() : undefined;
    };
    
    // Attempt common column names
    const kec = getVal('nm_kecamatan') || getVal('kecamatan');
    const kel = getVal('nm_kelurahan') || getVal('kelurahan');
    
    if (kec && kec.toUpperCase() !== 'OBJEK KHUSUS') {
      excelKecamatans.add(kec.toUpperCase());
    }
    if (kec && kel && kec.toUpperCase() !== 'OBJEK KHUSUS' && kel.toUpperCase() !== 'OBJEK KHUSUS') {
      excelKelurahans.add(`${kec.toUpperCase()} - ${kel.toUpperCase()}`);
    }
  });

  console.log(`Found in Excel: ${excelKecamatans.size} Kecamatan, ${excelKelurahans.size} Kelurahan`);

  // Read DB
  console.log('Reading DB...');
  const dbData = await prisma.taxRecord.groupBy({
    by: ['nm_kecamatan', 'nm_kelurahan']
  });

  const dbKecamatans = new Set();
  const dbKelurahans = new Set();

  dbData.forEach(row => {
    const kec = row.nm_kecamatan.toUpperCase();
    const kel = row.nm_kelurahan.toUpperCase();
    dbKecamatans.add(kec);
    dbKelurahans.add(`${kec} - ${kel}`);
  });

  console.log(`Found in DB: ${dbKecamatans.size} Kecamatan, ${dbKelurahans.size} Kelurahan`);

  // Compare
  console.log('\n--- KECAMATAN ---');
  const missingKecInDb = [...excelKecamatans].filter(x => !dbKecamatans.has(x));
  const extraKecInDb = [...dbKecamatans].filter(x => !excelKecamatans.has(x));
  
  console.log('Missing in DB:', missingKecInDb);
  console.log('Extra in DB:', extraKecInDb);

  console.log('\n--- KELURAHAN ---');
  const missingKelInDb = [...excelKelurahans].filter(x => !dbKelurahans.has(x));
  const extraKelInDb = [...dbKelurahans].filter(x => !excelKelurahans.has(x));

  console.log(`Missing in DB (${missingKelInDb.length}):`, missingKelInDb);
  console.log(`Extra in DB (${extraKelInDb.length}):`, extraKelInDb);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
