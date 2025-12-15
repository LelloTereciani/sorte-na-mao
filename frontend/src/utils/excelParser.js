import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract Mega-Sena data
 * @param {File} file - Excel file from input
 * @param {Function} logCallback - Optional callback for debug logs
 * @returns {Promise<Object>} Parsed data with draws array
 */
export const parseExcelFile = async (file, logCallback = console.log) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                logCallback(`📂 [DEBUG] File loaded: ${file.name} (${file.size} bytes)`);

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('O arquivo Excel não possui planilhas.');
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                logCallback(`📄 [DEBUG] Sheet name: ${firstSheetName}`);
                logCallback(`📄 [DEBUG] Original range: ${worksheet['!ref'] || 'undefined'}`);

                // FIX: Recalculate range if it appears incorrect or missing
                const cellAddresses = Object.keys(worksheet).filter(k => !k.startsWith('!'));
                logCallback(`📄 [DEBUG] Total cells found: ${cellAddresses.length}`);

                // Always try to recalculate range if it seems small or missing, or just to be safe on mobile
                if (!worksheet['!ref'] || cellAddresses.length > 0) {
                    // Recalculate the actual range
                    let maxRow = 0;
                    let maxCol = 0;

                    cellAddresses.forEach(addr => {
                        const decoded = XLSX.utils.decode_cell(addr);
                        if (decoded.r > maxRow) maxRow = decoded.r;
                        if (decoded.c > maxCol) maxCol = decoded.c;
                    });

                    const newRange = `A1:${XLSX.utils.encode_cell({ r: maxRow, c: maxCol })}`;

                    if (worksheet['!ref'] !== newRange) {
                        logCallback(`Note: Range updated from ${worksheet['!ref']} to ${newRange}`);
                        worksheet['!ref'] = newRange;
                    }
                }

                // Convert to JSON - use raw:false to get formatted values
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: null,
                    blankrows: false,
                    raw: false  // Get formatted values instead of raw
                });

                logCallback(`📄 Rows converted to JSON: ${jsonData.length}`);

                // Validate and extract data
                const parsedData = extractMegaSenaData(jsonData, logCallback);

                resolve(parsedData);
            } catch (error) {
                logCallback(`❌ [ERROR] Parse error: ${error.message}`);
                console.error('❌ [DEBUG] Parse error:', error);
                reject(new Error(`Erro ao processar arquivo Excel: ${error.message}`));
            }
        };

        reader.onerror = (err) => {
            logCallback(`❌ [ERROR] File read error: ${err}`);
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
/**
 * Extract and validate Mega-Sena data from parsed Excel
 * @param {Function} logCallback - Logging function
 * @returns {Object} Structured Mega-Sena data
 */
const extractMegaSenaData = (data, logCallback = console.log) => {
    logCallback('🔍 Extracting data...');

    if (!data || data.length === 0) {
        throw new Error('Arquivo vazio ou inválido (sem dados JSON)');
    }

    // PHASE 1: PRE-PROCESSING (Handle condensed/single-column formats)
    // Check if the first non-empty row is condensed (has 1 column with delimiters)
    let processedData = data;
    const firstRow = data.find(r => r && r.length > 0);

    if (firstRow && firstRow.length === 1 && typeof firstRow[0] === 'string') {
        const str = firstRow[0];
        let delimiter = null;
        if (str.includes('\t')) delimiter = '\t';
        else if (str.includes(';')) delimiter = ';';
        else if (str.includes(',')) delimiter = ',';

        if (delimiter) {
            logCallback(`⚠️ Condensed format detected. Splitting by '${delimiter === '\t' ? 'TAB' : delimiter}'`);
            processedData = data.map(row => {
                if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string') {
                    return row[0].split(delimiter);
                }
                return row;
            });
        }
    }

    // PHASE 2: FIND HEADERS
    let headerRow = null;
    let startRow = 0;

    for (let i = 0; i < Math.min(20, processedData.length); i++) {
        const row = processedData[i];
        if (!row || row.length === 0) continue;

        // Check if this row contains expected headers
        const rowStr = JSON.stringify(row).toLowerCase();

        // Match standard PT or custom EN headers
        if ((rowStr.includes('concurso') && (rowStr.includes('bola') || rowStr.includes('dezena'))) ||
            (rowStr.includes('contest') && rowStr.includes('number')) ||
            rowStr.includes('data do sorteio')) {
            headerRow = row;
            startRow = i + 1;
            logCallback(`✅ Header found at row ${i}: ${JSON.stringify(row).substring(0, 100)}...`);
            break;
        }
    }

    if (!headerRow) {
        logCallback('⚠️ No clear header found in first 20 rows. Trying row 0 as fallback.');
        headerRow = processedData[0];
        startRow = 1;
    }

    // PHASE 3: IDENTIFY COLUMNS
    const contestIdx = findColumnIndex(headerRow, ['concurso', 'contest', 'concursonumber']);
    const dataIdx = findColumnIndex(headerRow, ['data', 'data do sorteio', 'data sorteio', 'date']);

    // Check for single "numbers" column (custom format) or multiple "bola" columns (standard)
    const numbersColumnIdx = findColumnIndex(headerRow, ['numbers', 'dezenas', 'bolas']);

    let ballIndices = [];
    let isSingleColumnNumbers = false;

    if (numbersColumnIdx !== -1) {
        isSingleColumnNumbers = true;
        logCallback(`📍 Single 'Numbers' column detected at index ${numbersColumnIdx}`);
    } else {
        // Standard format: look for separate columns
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
    }

    logCallback(`📍 Indices: Contest=${contestIdx}, Date=${dataIdx}, ` +
        (isSingleColumnNumbers ? `NumbersCol=${numbersColumnIdx}` : `Balls=[${ballIndices.join(',')}]`));

    if (contestIdx === -1 || dataIdx === -1) {
        logCallback('❌ Critical columns missing (Contest or Date).');
        throw new Error(`Colunas obrigatórias não encontradas. Concurso: ${contestIdx}, Data: ${dataIdx}`);
    }

    if (!isSingleColumnNumbers && ballIndices.length < 6) {
        logCallback('❌ Not enough ball columns found.');
        throw new Error(`Apenas ${ballIndices.length} colunas de bolas encontradas e coluna única "Numbers" não existe.`);
    }

    // PHASE 4: EXTRACT DATA
    const draws = [];
    let validDraws = 0;
    let skippedRows = 0;

    for (let i = startRow; i < processedData.length; i++) {
        const row = processedData[i];

        if (!row || row.length === 0) {
            skippedRows++;
            continue;
        }

        try {
            // 1. EXTRACT CONCURSO
            const concursoValue = row[contestIdx];
            if (concursoValue == null || concursoValue === '') {
                skippedRows++;
                continue;
            }
            const concurso = parseInt(concursoValue);
            if (isNaN(concurso)) {
                skippedRows++;
                continue;
            }

            // 2. EXTRACT DATA
            const dataStr = row[dataIdx];
            if (!dataStr) {
                skippedRows++;
                continue;
            }

            // 3. EXTRACT DEZENAS
            let dezenas = [];

            if (isSingleColumnNumbers) {
                // Parse from single column (e.g. "[1, 2, 3...]" or "1,2,3...")
                let rawNums = row[numbersColumnIdx];
                if (typeof rawNums === 'string') {
                    rawNums = rawNums.trim();
                    // Handle JSON array format
                    if (rawNums.startsWith('[') && rawNums.endsWith(']')) {
                        try {
                            dezenas = JSON.parse(rawNums);
                        } catch (e) {
                            // Fallback if JSON parse fails
                            dezenas = rawNums.replace(/[\[\]]/g, '').split(',').map(n => parseInt(n.trim()));
                        }
                    } else {
                        // Handle comma separated
                        dezenas = rawNums.split(',').map(n => parseInt(n.trim()));
                    }
                } else if (Array.isArray(rawNums)) {
                    // Already an array?
                    dezenas = rawNums;
                }
            } else {
                // Standard format
                for (const idx of ballIndices) {
                    const value = row[idx];
                    const num = parseInt(value);
                    if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
                    dezenas.push(num);
                }
            }

            // Validate Dezenas
            dezenas = dezenas.filter(n => !isNaN(n) && n > 0 && n <= 60);
            if (dezenas.length !== 6) {
                throw new Error(`Invalid ball count: ${dezenas.length}`);
            }

            // 4. PARSE DATE
            let formattedDate;
            try {
                if (typeof dataStr === 'number') {
                    formattedDate = excelDateToJSDate(dataStr);
                } else {
                    // Try Brazilian first, then ISO/Other
                    if (String(dataStr).includes('/')) {
                        formattedDate = parseBrazilianDate(dataStr);
                    } else {
                        // Try direct date parsing
                        const d = new Date(dataStr);
                        if (!isNaN(d.getTime())) {
                            formattedDate = d.toISOString().split('T')[0];
                        } else {
                            throw new Error('Date format unknown');
                        }
                    }
                }
            } catch (e) {
                // logCallback(`Row ${i} date error: ${e.message}`);
                throw e;
            }

            draws.push({
                concurso,
                data: formattedDate,
                dezenas: dezenas.sort((a, b) => a - b)
            });

            validDraws++;
        } catch (error) {
            skippedRows++;
            if (skippedRows < 5) {
                // logCallback(`Row ${i} skipped: ${error.message}`);
            }
        }
    }

    logCallback(`📊 Processed: ${validDraws} valid, ${skippedRows} skipped`);

    if (validDraws === 0) {
        throw new Error('Nenhum sorteio válido encontrado. Verifique se o arquivo está no formato correto.');
    }

    // Sort by concurso number
    draws.sort((a, b) => a.concurso - b.concurso);

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
