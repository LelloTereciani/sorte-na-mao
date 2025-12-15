// Test the exact parsing logic with the user's file
const XLSX = require('xlsx');
const fs = require('fs');

console.log('🔍 Testing Excel parser with user file...\n');

// Read the file
const filePath = '/home/lello/Mega-Sena.xlsx';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

console.log('📄 Worksheet range:', worksheet['!ref']);
console.log('📄 Sheet names:', workbook.SheetNames);

// Method 1: sheet_to_json with header:1
const jsonData1 = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: false
});
console.log('\n📊 Method 1 (sheet_to_json): ', jsonData1.length, 'rows');
if (jsonData1.length > 0) {
    console.log('First row:', jsonData1[0]);
}
if (jsonData1.length > 1) {
    console.log('Second row:', jsonData1[1]);
}

// Method 2: Manual cell-by-cell reading
console.log('\n📊 Method 2 (cell-by-cell):');
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('Range decoded:', range);
console.log(`Rows: ${range.s.r} to ${range.e.r} (${range.e.r - range.s.r + 1} total)`);
console.log(`Cols: ${range.s.c} to ${range.e.c} (${range.e.c - range.s.c + 1} total)`);

const alternativeData = [];
for (let R = range.s.r; R <= range.e.r; ++R) {
    const row = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        row.push(cell ? (cell.w || cell.v) : null);
    }
    alternativeData.push(row);
}

console.log('Alternative method rows:', alternativeData.length);
if (alternativeData.length > 0) {
    console.log('First row:', alternativeData[0]);
}
if (alternativeData.length > 1) {
    console.log('Second row:', alternativeData[1]);
}

// Check if there are hidden sheets
console.log('\n📋 All sheets:');
workbook.SheetNames.forEach((name, idx) => {
    const sheet = workbook.Sheets[name];
    const range = sheet['!ref'];
    console.log(`  ${idx + 1}. ${name}: ${range}`);
});
