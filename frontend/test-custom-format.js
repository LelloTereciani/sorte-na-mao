
const XLSX = require('xlsx');

// Mock data simulating the user's file content
// Based on logs: "contestNumber\tdate\tnumbers"
const mockData = [
    ["contestNumber\tdate\tnumbers"],
    ["2525\t01/10/2022\t[1, 2, 3, 4, 5, 6]"],
    ["2526\t05/10/2022\t[10, 20, 30, 40, 50, 60]"]
];

// Create a workbook
const ws = XLSX.utils.aoa_to_sheet(mockData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "in");

// Simulate the extraction logic we want to implement
function testExtraction(data) {
    console.log("Raw data length:", data.length);
    console.log("First row:", data[0]);

    // PRE-PROCESSING: Check for single column with delimiters
    const processedData = data.map(row => {
        // Check if row is array and has only 1 element that is a string
        if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string') {
            const str = row[0];
            if (str.includes('\t')) return str.split('\t');
            if (str.includes(';')) return str.split(';');
            if (str.includes(',')) return str.split(',');
        }
        return row;
    });

    console.log("\nProcessed first row:", processedData[0]);
    console.log("Processed second row:", processedData[1]);

    const header = processedData[0].map(h => h.toLowerCase().trim());
    console.log("Header keys:", header);

    // MAPPINGS
    const findIdx = (keys) => header.findIndex(h => keys.some(k => h.includes(k)));

    const contestIdx = findIdx(['contest', 'concurso']);
    const dateIdx = findIdx(['date', 'data']);
    const numbersIdx = findIdx(['numbers', 'bola', 'dezena']);

    console.log(`\nIndices found: Contest=${contestIdx}, Date=${dateIdx}, Numbers=${numbersIdx}`);

    if (contestIdx === -1 || dateIdx === -1 || numbersIdx === -1) {
        console.error("FAILED to find indices");
        return;
    }

    const firstDraw = processedData[1];
    const contest = firstDraw[contestIdx];
    const date = firstDraw[dateIdx];
    let numbers = firstDraw[numbersIdx];

    // Numbers parsing
    if (typeof numbers === 'string' && numbers.startsWith('[')) {
        numbers = JSON.parse(numbers);
    }

    console.log(`\nParsed First Draw:`);
    console.log(`Contest: ${contest}`);
    console.log(`Date: ${date}`);
    console.log(`Numbers: ${numbers} (Type: ${Array.isArray(numbers) ? 'Array' : typeof numbers})`);
}

// Convert sheet to json like the app does
const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
testExtraction(jsonData);
