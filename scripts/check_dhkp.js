const XLSX = require('xlsx');

function main() {
  console.log('Loading DHKP excel file...');
  const workbook = XLSX.readFile('C:\\\\Users\\\\msyaf\\\\Downloads\\\\DHKP 17-6-26.xlsx');
  console.log('Sheet names:', workbook.SheetNames);
  
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Loaded ${rawData.length} rows.`);
  
  // Try to find the column index for Kelurahan
  if (rawData.length > 0) {
    console.log('Header row:', rawData[0]);
  }
}

main();
