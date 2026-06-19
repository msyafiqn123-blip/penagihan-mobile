const XLSX = require('xlsx');

function main() {
  console.log('Loading DHKP excel file...');
  const workbook = XLSX.readFile('C:\\\\Users\\\\msyaf\\\\Downloads\\\\DHKP 17-6-26.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  const kelurahans = new Set(rawData.map(r => r.nm_kelurahan).filter(Boolean));
  console.log('Total Distinct Kelurahan in DHKP:', kelurahans.size);
  
  // Just in case there are names that differ only by whitespace
  const normalized = new Set(rawData.map(r => r.nm_kelurahan ? r.nm_kelurahan.trim().toUpperCase() : null).filter(Boolean));
  console.log('Total Normalized Kelurahan in DHKP:', normalized.size);
}
main();
