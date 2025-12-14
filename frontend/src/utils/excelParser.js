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

                // Convert to JSON with options to handle empty cells
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: null,  // Use null for empty cells
                    blankrows: false  // Skip completely blank rows
                });

                console.log(`📄 Arquivo Excel lido: ${jsonData.length} linhas`);

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

    // Find header row
    let headerRow = null;
    let startRow = 0;

    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // Check if this row contains expected headers
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes('concurso') || rowStr.includes('bola') || rowStr.includes('dezena')) {
            headerRow = row;
            startRow = i + 1;
            break;
        }
    }

    if (!headerRow) {
        // No header found, assume first row is header
        headerRow = data[0];
        startRow = 1;
    }

    console.log('📋 Header encontrado:', headerRow);

    // Find column indices
    const concursoIdx = findColumnIndex(headerRow, ['concurso']);
    const dataIdx = findColumnIndex(headerRow, ['data', 'data do sorteio', 'data sorteio']);

    // Find ball/dezena columns (try both "Bola" and "Dezena")
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

    console.log(`📍 Índices encontrados: Concurso=${concursoIdx}, Data=${dataIdx}, Bolas=${ballIndices.join(',')}`);

    if (concursoIdx === -1) {
        throw new Error('Coluna "Concurso" não encontrada no arquivo');
    }

    if (dataIdx === -1) {
        throw new Error('Coluna de data não encontrada no arquivo');
    }

    if (ballIndices.length < 6) {
        throw new Error(`Apenas ${ballIndices.length} colunas de bolas encontradas. Necessário 6 colunas.`);
    }

    const draws = [];
    let validDraws = 0;
    let skippedRows = 0;

    // Process data rows
    for (let i = startRow; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row || row.length === 0) {
            skippedRows++;
            continue;
        }

        try {
            // Extract concurso
            const concursoValue = row[concursoIdx];
            if (!concursoValue || concursoValue === '' || concursoValue === null) {
                skippedRows++;
                continue;
            }

            const concurso = parseInt(concursoValue);
            if (isNaN(concurso)) {
                skippedRows++;
                continue;
            }

            // Extract data
            const dataStr = row[dataIdx];
            if (!dataStr) {
                skippedRows++;
                continue;
            }

            // Extract dezenas
            const dezenas = [];
            for (const idx of ballIndices) {
                const value = row[idx];
                const num = parseInt(value);
                if (isNaN(num) || num < 1 || num > 60) {
                    throw new Error(`Número inválido: ${value}`);
                }
                dezenas.push(num);
            }

            if (dezenas.length !== 6) {
                skippedRows++;
                continue;
            }

            // Parse date
            let formattedDate;
            if (typeof dataStr === 'number') {
                formattedDate = excelDateToJSDate(dataStr);
            } else {
                formattedDate = parseBrazilianDate(dataStr);
            }

            draws.push({
                concurso,
                data: formattedDate,
                dezenas: dezenas.sort((a, b) => a - b)
            });

            validDraws++;
        } catch (error) {
            skippedRows++;
            if (validDraws === 0 && i < startRow + 5) {
                // Log errors for first few rows to help debugging
                console.warn(`Linha ${i + 1} ignorada:`, error.message);
            }
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
 * Find column index by searching for multiple possible names
 * @param {Array} headerRow - Header row from Excel
 * @param {Array} possibleNames - Array of possible column names
 * @returns {number} Column index or -1 if not found
 */
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
