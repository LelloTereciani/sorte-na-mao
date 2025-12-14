import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract Mega-Sena data
 * @param {File} file - Excel file from input
 * @returns {Promise<Object>} Parsed data with draws array
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Validate and extract data
                const parsedData = extractMegaSenaData(jsonData);

                resolve(parsedData);
            } catch (error) {
                reject(new Error(`Erro ao processar arquivo Excel: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Extract and validate Mega-Sena data from parsed Excel
 * @param {Array} data - Raw data from Excel
 * @returns {Object} Structured Mega-Sena data
 */
const extractMegaSenaData = (data) => {
    if (!data || data.length === 0) {
        throw new Error('Arquivo vazio ou inválido');
    }

    // Find header row (usually first row)
    let startRow = 0;

    // Skip empty rows
    while (startRow < data.length && (!data[startRow] || data[startRow].length === 0)) {
        startRow++;
    }

    if (startRow >= data.length) {
        throw new Error('Nenhum dado encontrado no arquivo');
    }

    const draws = [];
    let validDraws = 0;
    let skippedRows = 0;

    // Process data rows (skip header)
    for (let i = startRow + 1; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row || row.length < 8) {
            skippedRows++;
            continue;
        }

        try {
            // Extract first 8 columns: Concurso, Data, Dezena1-6
            const concurso = parseInt(row[0]);
            const dataStr = row[1];
            const dezenas = [
                parseInt(row[2]),
                parseInt(row[3]),
                parseInt(row[4]),
                parseInt(row[5]),
                parseInt(row[6]),
                parseInt(row[7])
            ];

            // Validate data
            if (isNaN(concurso) || !dataStr) {
                skippedRows++;
                continue;
            }

            // Validate dezenas
            const validDezenas = dezenas.every(d => !isNaN(d) && d >= 1 && d <= 60);
            if (!validDezenas) {
                skippedRows++;
                continue;
            }

            // Parse date (format: DD/MM/YYYY or Excel serial date)
            let formattedDate;
            if (typeof dataStr === 'number') {
                // Excel serial date
                formattedDate = excelDateToJSDate(dataStr);
            } else {
                // String date DD/MM/YYYY
                formattedDate = parseBrazilianDate(dataStr);
            }

            draws.push({
                concurso,
                data: formattedDate,
                dezenas: dezenas.sort((a, b) => a - b) // Sort numbers
            });

            validDraws++;
        } catch (error) {
            skippedRows++;
            console.warn(`Linha ${i + 1} ignorada:`, error.message);
        }
    }

    if (validDraws === 0) {
        throw new Error('Nenhum sorteio válido encontrado no arquivo');
    }

    // Sort by concurso number
    draws.sort((a, b) => a.concurso - b.concurso);

    console.log(`✅ Processados ${validDraws} sorteios (${skippedRows} linhas ignoradas)`);

    return {
        draws,
        metadata: {
            totalDraws: draws.length,
            firstDraw: draws[0].concurso,
            lastDraw: draws[draws.length - 1].concurso,
            lastUpdated: new Date().toISOString(),
            skippedRows
        }
    };
};

/**
 * Convert Excel serial date to ISO date string
 * @param {number} serial - Excel serial date
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
const excelDateToJSDate = (serial) => {
    // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + serial * 86400000);

    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Parse Brazilian date format (DD/MM/YYYY) to ISO (YYYY-MM-DD)
 * @param {string} dateStr - Date in DD/MM/YYYY format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
const parseBrazilianDate = (dateStr) => {
    const parts = String(dateStr).split('/');
    if (parts.length !== 3) {
        throw new Error(`Formato de data inválido: ${dateStr}`);
    }

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    return `${year}-${month}-${day}`;
};

/**
 * Validate Mega-Sena data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid
 */
export const validateMegaSenaData = (data) => {
    if (!data || !data.draws || !Array.isArray(data.draws)) {
        return false;
    }

    if (data.draws.length === 0) {
        return false;
    }

    // Validate first draw structure
    const firstDraw = data.draws[0];
    if (!firstDraw.concurso || !firstDraw.data || !firstDraw.dezenas) {
        return false;
    }

    if (!Array.isArray(firstDraw.dezenas) || firstDraw.dezenas.length !== 6) {
        return false;
    }

    return true;
};

export default {
    parseExcelFile,
    validateMegaSenaData
};
