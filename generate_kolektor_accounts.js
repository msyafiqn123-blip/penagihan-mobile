const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching distinct Kelurahans from TaxRecord...');
  
  const distinctLocations = await prisma.taxRecord.groupBy({
    by: ['nm_kecamatan', 'nm_kelurahan']
  });

  console.log(`Found ${distinctLocations.length} locations. Generating accounts...`);

  let createdCount = 0;
  let existCount = 0;

  for (const loc of distinctLocations) {
    const kec = loc.nm_kecamatan.trim();
    const kel = loc.nm_kelurahan.trim();

    // Sanitize username: lowercase, remove special chars, replace spaces with underscores
    let username = `kolektor_${kel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      existCount++;
    } else {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'KELURAHAN',
          nm_kecamatan: kec,
          nm_kelurahan: kel
        }
      });
      createdCount++;
    }
  }

  console.log(`Finished! Created: ${createdCount}, Already existed: ${existCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
