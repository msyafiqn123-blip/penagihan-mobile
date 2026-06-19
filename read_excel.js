const XLSX = require('xlsx');

const workbook = XLSX.readFile('C:\\Users\\msyaf\\Downloads\\SINGKATAN KECAMATAN.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data, null, 2));
