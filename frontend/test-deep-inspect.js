// Deep inspection of Excel file structure
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/home/lello/Proj APP/sorte_na_mao_app/backend/data/Mega-Sena.xlsx';

console.log('🔍 Deep inspection of Excel file\n');

const fileBuffer = fs.readFileSync(filePath);

// Try different read options
console.log('='.repeat(80));
console.log('Test 1: Default options');
console.log('='.repeat(80));
let workbook = XLSX.read(fileBuffer, { type: 'buffer' });
console.log('Sheets:', workbook.SheetNames);
let ws = workbook.Sheets[workbook.SheetNames[0]];
console.log('Range:', ws['!ref']);
console.log('Rows:', XLSX.utils.sheet_to_json(ws, { header: 1 }).length);

console.log('\n' + '='.repeat(80));
console.log('Test 2: With cellDates option');
console.log('='.repeat(80));
workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
ws = workbook.Sheets[workbook.SheetNames[0]];
console.log('Range:', ws['!ref']);
console.log('Rows:', XLSX.utils.sheet_to_json(ws, { header: 1 }).length);

console.log('\n' + '='.repeat(80));
console.log('Test 3: With sheetRows option (read first 100 rows)');
console.log('='.repeat(80));
workbook = XLSX.read(fileBuffer, { type: 'buffer', sheetRows: 100 });
ws = workbook.Sheets[workbook.SheetNames[0]];
console.log('Range:', ws['!ref']);
console.log('Rows:', XLSX.utils.sheet_to_json(ws, { header: 1 }).length);

console.log('\n' + '='.repeat(80));
console.log('Test 4: Inspect worksheet object');
console.log('='.repeat(80));
workbook = XLSX.read(fileBuffer, { type: 'buffer' });
ws = workbook.Sheets[workbook.SheetNames[0]];

// List all cell addresses
const cellAddresses = Object.keys(ws).filter(k => !k.startsWith('!'));
console.log('Total cells:', cellAddresses.length);
console.log('First 20 cell addresses:', cellAddresses.slice(0, 20));

// Check if there are cells beyond row 1
const row2Cells = cellAddresses.filter(addr => addr.match(/^[A-Z]+2$/));
console.log('Cells in row 2:', row2Cells.length);
if (row2Cells.length > 0) {
    console.log('Row 2 cells:', row2Cells);
    console.log('Sample cell A2:', ws['A2']);
}

console.log('\n' + '='.repeat(80));
console.log('Test 5: Check for hidden rows/data');
console.log('='.repeat(80));
console.log('Worksheet keys:', Object.keys(ws));
console.log('!ref:', ws['!ref']);
console.log('!rows:', ws['!rows']);
console.log('!cols:', ws['!cols']);
console.log('!merges:', ws['!merges']);
