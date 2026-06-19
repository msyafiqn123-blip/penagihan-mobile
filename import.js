const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting data import...");
    
    // 1. Read Excel
    const filePath = 'C:\\Users\\msyaf\\Downloads\\DHKP 17-6-26.xlsx';
    console.log(`Reading file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse JSON and clean column names (strip leading/trailing spaces)
    const rawData = xlsx.utils.sheet_to_json(sheet);
    const data = rawData.map(row => {
        const cleanedRow = {};
        for (const key in row) {
            cleanedRow[key.trim()] = row[key];
        }
        return cleanedRow;
    });

    console.log(`Total rows in Excel: ${data.length}`);

    // 2. Filter data < 2,000,000 IDR
    const filteredData = data.filter(row => row.pbb_yg_harus_dibayar_sppt < 2000000);
    console.log(`Rows after filtering (< 2,000,000): ${filteredData.length}`);

    // Clean DB
    console.log("Clearing existing database...");
    await prisma.taxRecord.deleteMany();
    await prisma.user.deleteMany();

    // Setup Admin
    const defaultPassword = await bcrypt.hash('12345678', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            password: defaultPassword,
            role: 'ADMIN'
        }
    });
    console.log("Admin user created.");

    // 3. Process records and build Kelurahan unique list
    const kelurahansMap = new Map(); // key: nm_kelurahan, value: nm_kecamatan
    
    console.log("Preparing records for insertion...");
    const batchSize = 10000;
    
    // We will do it in batches to avoid running out of memory
    for (let i = 0; i < filteredData.length; i += batchSize) {
        const batch = filteredData.slice(i, i + batchSize);
        const recordsToInsert = [];
        
        for (const row of batch) {
            const kec = row.nm_kecamatan;
            const kel = row.nm_kelurahan;
            const nop = row.nop ? String(row.nop).trim() : '';
            
            // Generate Blok: usually index 4 when split by '.'
            // Example NOP: 32.16.080.014.001.0 -> block is 001
            let blok = "000";
            if (nop) {
                const parts = nop.split('.');
                if (parts.length >= 5) {
                    blok = parts[4];
                }
            }

            recordsToInsert.push({
                nm_kecamatan: kec,
                nm_kelurahan: kel,
                nop: nop,
                nm_wp: String(row.nm_wp || ''),
                alamat_op: String(row.alamat_op || ''),
                luas_bumi_sppt: Number(row.luas_bumi_sppt || 0),
                luas_bng_sppt: Number(row.luas_bng_sppt || 0),
                pbb_yg_harus_dibayar_sppt: Number(row.pbb_yg_harus_dibayar_sppt || 0),
                status_pembayaran_sppt: String(row.status_pembayaran_sppt || '').toUpperCase(),
                blok: blok
            });

            if (kec && kel && kec !== 'OBJEK KHUSUS' && kel !== 'OBJEK KHUSUS') {
                if (!kelurahansMap.has(kel)) {
                    kelurahansMap.set(kel, kec);
                }
            }
        }

        await prisma.taxRecord.createMany({
            data: recordsToInsert
        });
        console.log(`Inserted batch ${i} to ${i + batchSize}`);
    }

    // 4. Create Kelurahan Accounts
    console.log(`Creating ${kelurahansMap.size} Kelurahan accounts...`);
    const usersToInsert = [];
    
    for (const [kel, kec] of kelurahansMap.entries()) {
        // SingkatanKecamatan -> First 3 letters of Kecamatan
        const singkatan = kec.substring(0, 3).toUpperCase();
        
        // Remove spaces for username, e.g. "Ciseureuh" -> "Ciseureuh"
        const formattedKel = kel.replace(/\s+/g, '');
        const username = `${formattedKel}_${singkatan}`;

        usersToInsert.push({
            username: username,
            password: defaultPassword,
            role: 'KELURAHAN',
            nm_kelurahan: kel,
            nm_kecamatan: kec
        });
    }

    await prisma.user.createMany({
        data: usersToInsert
    });

    console.log("Import completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
