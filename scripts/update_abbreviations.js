const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  // Load abbreviations from excel
  const workbook = XLSX.readFile('C:\\Users\\msyaf\\Downloads\\SINGKATAN KECAMATAN.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const singkatanMap = {};
  data.forEach(row => {
    if (row.KECAMATAN && row.SINGKATAN) {
      singkatanMap[row.KECAMATAN.trim().toUpperCase()] = row.SINGKATAN.trim().toUpperCase();
    }
  });

  const users = await prisma.user.findMany({
    where: {
      role: { in: ['KOLEKTOR', 'PENAGIHAN'] }
    }
  });

  let updatedCount = 0;

  for (const user of users) {
    if (!user.nm_kecamatan) continue;
    
    const kec = user.nm_kecamatan.trim().toUpperCase();
    const newSingkatan = singkatanMap[kec];
    
    if (newSingkatan) {
      // Determine what the username should be based on its role
      let baseName = '';
      if (user.role === 'KOLEKTOR' && user.nm_kelurahan) {
        baseName = user.nm_kelurahan.trim().replace(/\s+/g, '').toUpperCase();
      } else {
        baseName = kec.replace(/\s+/g, '');
      }

      const expectedUsername = `${baseName}_${newSingkatan}`;
      
      if (user.username !== expectedUsername) {
        console.log(`Updating ${user.username} -> ${expectedUsername}`);
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { username: expectedUsername }
          });
          updatedCount++;
        } catch (e) {
          console.error(`Failed to update ${user.username}:`, e.message);
        }
      }
    } else {
      console.warn(`No abbreviation found for kecamatan: ${kec}`);
    }
  }

  console.log(`Successfully updated ${updatedCount} usernames.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
