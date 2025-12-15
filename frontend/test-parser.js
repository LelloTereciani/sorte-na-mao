// Test script to verify Excel parser works with actual file
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '../backend/data/Mega-Sena.xlsx');
const workbook = XLSX.readFile(filePath);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Total rows:', data.length);
console.log('\nFirst 3 rows:');
data.slice(0, 3).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});

// Find header
let headerRow = null;
let startRow = 0;

for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('concurso') || rowStr.includes('bola') || rowStr.includes('dezena')) {
        headerRow = row;
        startRow = i + 1;
        break;
    }
}

console.log('\nHeader row:', headerRow);
console.log('Start row:', startRow);

// Find column indices
const findColumnIndex = (headerRow, possibleNames) => {
    for (let i = 0; i < headerRow.length; i++) {
        const cellValue = String(headerRow[i] || '').toLowerCase().trim();
        for (const name of possibleNames) {
            if (cellValue === name.toLowerCase() || cellValue.includes(name.toLowerCase())) {
                return i;
            }
        }
    }
    return -1;
};

const concursoIdx = findColumnIndex(headerRow, ['concurso']);
const dataIdx = findColumnIndex(headerRow, ['data', 'data do sorteio', 'data sorteio']);

const ballIndices = [];
for (let i = 1; i <= 6; i++) {
    const idx = findColumnIndex(headerRow, [
        `bola${i}`, `bola ${i}`,
        `dezena${i}`, `dezena ${i}`,
        `d${i}`, `b${i}`
    ]);
    if (idx !== -1) {
        ballIndices.push(idx);
    }
}

console.log('\nColumn indices:');
console.log('Concurso:', concursoIdx);
console.log('Data:', dataIdx);
console.log('Bolas:', ballIndices);

// Test first data row
const firstDataRow = data[startRow];
console.log('\nFirst data row:', firstDataRow);
console.log('Concurso:', firstDataRow[concursoIdx]);
console.log('Data:', firstDataRow[dataIdx]);
console.log('Bolas:', ballIndices.map(idx => firstDataRow[idx]));

// Count valid rows
let validCount = 0;
for (let i = startRow; i < Math.min(startRow + 10, data.length); i++) {
    const row = data[i];
    if (!row) continue;

    const concurso = parseInt(row[concursoIdx]);
    if (!isNaN(concurso)) {
        validCount++;
    }
}

console.log('\nValid rows in first 10:', validCount);
