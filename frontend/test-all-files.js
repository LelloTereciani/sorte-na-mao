// Test all Mega-Sena files
const XLSX = require('xlsx');
const fs = require('fs');

const files = [
    '/home/lello/Mega-Sena.xlsx',
    '/home/lello/Downloads/Mega-Sena.xlsx',
    '/home/lello/Proj APP/sorte_na_mao_app/backend/data/Mega-Sena.xlsx'
];

files.forEach(filePath => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📁 Testing: ${filePath}`);
    console.log('='.repeat(80));

    try {
        if (!fs.existsSync(filePath)) {
            console.log('❌ File not found');
            return;
        }

        const stats = fs.statSync(filePath);
        console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        console.log(`📄 Worksheet range: ${worksheet['!ref']}`);

        // Get row count from range
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const rowCount = range.e.r - range.s.r + 1;
        console.log(`📊 Total rows (from range): ${rowCount}`);

        // Try to read with sheet_to_json
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            blankrows: false,
            raw: false
        });
        console.log(`📊 Rows read by sheet_to_json: ${jsonData.length}`);

        if (jsonData.length > 1) {
            console.log('✅ Has data rows!');
            console.log('First data row:', jsonData[1].slice(0, 8));
        } else {
            console.log('❌ Only header, no data rows');
        }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
});
