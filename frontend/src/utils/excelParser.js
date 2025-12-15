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
 * @param {Array} data - Raw data from Excel
 * @param {Function} logCallback - Logging function
 * @returns {Object} Structured Mega-Sena data
 */
const extractMegaSenaData = (data, logCallback = console.log) => {
    logCallback('🔍 Extracting data...');

    if (!data || data.length === 0) {
        throw new Error('Arquivo vazio ou inválido (sem dados JSON)');
    }

    // Find header row
    let headerRow = null;
    let startRow = 0;

    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // Check if this row contains expected headers
        const rowStr = JSON.stringify(row).toLowerCase();

        if ((rowStr.includes('concurso') && rowStr.includes('bola')) ||
            (rowStr.includes('concurso') && rowStr.includes('dezena')) ||
            rowStr.includes('data do sorteio')) {
            headerRow = row;
            startRow = i + 1;
            logCallback(`✅ Header found at row ${i}: ${JSON.stringify(row).substring(0, 100)}...`);
            break;
        }
    }

    if (!headerRow) {
        logCallback('⚠️ No clear header found in first 20 rows. Trying row 0 as fallback.');
        headerRow = data[0];
        startRow = 1;
    }

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

    logCallback(`📍 Indices: Concurso=${concursoIdx}, Data=${dataIdx}, Balls=[${ballIndices.join(',')}]`);

    if (concursoIdx === -1 || dataIdx === -1 || ballIndices.length < 6) {
        logCallback('❌ Could not identify all required columns.');
        logCallback(`Header row used: ${JSON.stringify(headerRow)}`);
        throw new Error(`Colunas não identificadas. Concurso: ${concursoIdx}, Data: ${dataIdx}, Bolas: ${ballIndices.length}/6`);
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
            // Extract and validate - be resilient
            const concursoValue = row[concursoIdx];
            if (concursoValue == null || concursoValue === '') {
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
                    throw new Error(`Invalid number: ${value}`);
                }
                dezenas.push(num);
            }

            if (dezenas.length !== 6) {
                throw new Error('Wrong number count');
            }

            // Parse date
            let formattedDate;
            try {
                if (typeof dataStr === 'number') {
                    formattedDate = excelDateToJSDate(dataStr);
                } else {
                    formattedDate = parseBrazilianDate(dataStr);
                }
            } catch (e) {
                // If date fails, skip row but don't crash
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
            // Only log first few errors to avoid spamming the UI
            if (skippedRows < 5) {
                // logCallback(`Skip row ${i}: ${error.message}`);
            }
        }
    }

    logCallback(`📊 Processed: ${validDraws} valid, ${skippedRows} skipped`);

    if (validDraws === 0) {
        throw new Error('Nenhum sorteio válido encontrado. Verifique se o arquivo está no formato correto da Caixa.');
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
