const XLSX = require('xlsx');

function main() {
  console.log('Loading DHKP excel file...');
  const workbook = XLSX.readFile('C:\\\\Users\\\\msyaf\\\\Downloads\\\\DHKP 17-6-26.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  const kelurahans = new Set();
  rawData.forEach(row => {
    let kel = null;
    for (let key in row) {
      if (key.trim().toLowerCase() === 'nm_kelurahan') {
        kel = row[key];
        break;
      }
    }
    if (kel && typeof kel === 'string') {
      kelurahans.add(kel.trim().toUpperCase());
    }
  });

  console.log(`Total Kelurahan di DHKP: ${kelurahans.size}`);
}

main();
