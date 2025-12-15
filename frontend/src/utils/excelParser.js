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

                console.log('📄 [DEBUG] Original worksheet range:', worksheet['!ref']);

                // FIX: Recalculate range if it appears incorrect
                // Sometimes Excel files have incorrect !ref property
                const cellAddresses = Object.keys(worksheet).filter(k => !k.startsWith('!'));
                console.log('📄 [DEBUG] Total cells in worksheet:', cellAddresses.length);

                if (cellAddresses.length > 100) {
                    // Recalculate the actual range
                    let maxRow = 0;
                    let maxCol = 0;

                    cellAddresses.forEach(addr => {
                        const decoded = XLSX.utils.decode_cell(addr);
                        if (decoded.r > maxRow) maxRow = decoded.r;
                        if (decoded.c > maxCol) maxCol = decoded.c;
                    });

                    const newRange = `A1:${XLSX.utils.encode_cell({ r: maxRow, c: maxCol })}`;
                    console.log('📄 [DEBUG] Recalculated range:', newRange);

                    // Update the worksheet range
                    worksheet['!ref'] = newRange;
                }

                // Convert to JSON - use raw:false to get formatted values
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: null,
                    blankrows: false,
                    raw: false  // Get formatted values instead of raw
                });

                console.log(`📄 Arquivo Excel lido: ${jsonData.length} linhas`);

                // Validate and extract data
                const parsedData = extractMegaSenaData(jsonData);

                resolve(parsedData);
            } catch (error) {
                console.error('❌ [DEBUG] Parse error:', error);
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
    console.log('🔍 [DEBUG] extractMegaSenaData called');
    console.log('🔍 [DEBUG] Total rows received:', data?.length);

    if (!data || data.length === 0) {
        console.error('❌ [DEBUG] Data is empty or null');
        throw new Error('Arquivo vazio ou inválido');
    }

    console.log('🔍 [DEBUG] First 3 rows:', data.slice(0, 3));

    // Find header row
    let headerRow = null;
    let startRow = 0;

    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row || row.length === 0) {
            console.log(`🔍 [DEBUG] Row ${i} is empty, skipping`);
            continue;
        }

        // Check if this row contains expected headers
        const rowStr = JSON.stringify(row).toLowerCase();
        console.log(`🔍 [DEBUG] Row ${i} string:`, rowStr.substring(0, 100));

        if (rowStr.includes('concurso') || rowStr.includes('bola') || rowStr.includes('dezena')) {
            headerRow = row;
            startRow = i + 1;
            console.log(`✅ [DEBUG] Header found at row ${i}`);
            break;
        }
    }

    if (!headerRow) {
        console.warn('⚠️ [DEBUG] No header found in first 10 rows, using row 0 as header');
        headerRow = data[0];
        startRow = 1;
    }

    console.log('📋 [DEBUG] Header encontrado:', headerRow);
    console.log('📋 [DEBUG] Data will start at row:', startRow);

    // Find column indices
    const concursoIdx = findColumnIndex(headerRow, ['concurso']);
    const dataIdx = findColumnIndex(headerRow, ['data', 'data do sorteio', 'data sorteio']);

    console.log(`🔍 [DEBUG] Concurso index: ${concursoIdx}`);
    console.log(`🔍 [DEBUG] Data index: ${dataIdx}`);

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

    console.log(`📍 [DEBUG] Índices encontrados: Concurso=${concursoIdx}, Data=${dataIdx}, Bolas=${ballIndices.join(',')}`);

    if (concursoIdx === -1) {
        console.error('❌ [DEBUG] Concurso column not found');
        console.error('❌ [DEBUG] Available columns:', headerRow);
        throw new Error('Coluna "Concurso" não encontrada no arquivo');
    }

    if (dataIdx === -1) {
        console.error('❌ [DEBUG] Data column not found');
        console.error('❌ [DEBUG] Available columns:', headerRow);
        throw new Error('Coluna de data não encontrada no arquivo');
    }

    if (ballIndices.length < 6) {
        console.error(`❌ [DEBUG] Only ${ballIndices.length} ball columns found`);
        console.error('❌ [DEBUG] Available columns:', headerRow);
        throw new Error(`Apenas ${ballIndices.length} colunas de bolas encontradas. Necessário 6 colunas.`);
    }

    const draws = [];
    let validDraws = 0;
    let skippedRows = 0;

    console.log(`🔍 [DEBUG] Starting to process rows from ${startRow} to ${data.length}`);

    // Process data rows
    for (let i = startRow; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row || row.length === 0) {
            skippedRows++;
            continue;
        }

        // Log first few rows for debugging
        if (i < startRow + 3) {
            console.log(`🔍 [DEBUG] Processing row ${i}:`, row);
        }

        try {
            // Extract concurso
            const concursoValue = row[concursoIdx];
            if (!concursoValue || concursoValue === '' || concursoValue === null) {
                if (i < startRow + 3) {
                    console.log(`⚠️ [DEBUG] Row ${i}: Empty concurso value`);
                }
                skippedRows++;
                continue;
            }

            const concurso = parseInt(concursoValue);
            if (isNaN(concurso)) {
                if (i < startRow + 3) {
                    console.log(`⚠️ [DEBUG] Row ${i}: Invalid concurso: ${concursoValue}`);
                }
                skippedRows++;
                continue;
            }

            // Extract data
            const dataStr = row[dataIdx];
            if (!dataStr) {
                if (i < startRow + 3) {
                    console.log(`⚠️ [DEBUG] Row ${i}: Empty data value`);
                }
                skippedRows++;
                continue;
            }

            // Extract dezenas
            const dezenas = [];
            for (const idx of ballIndices) {
                const value = row[idx];
                const num = parseInt(value);
                if (isNaN(num) || num < 1 || num > 60) {
                    throw new Error(`Número inválido: ${value} at index ${idx}`);
                }
                dezenas.push(num);
            }

            if (dezenas.length !== 6) {
                if (i < startRow + 3) {
                    console.log(`⚠️ [DEBUG] Row ${i}: Only ${dezenas.length} valid numbers`);
                }
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

            if (validDraws === 1) {
                console.log(`✅ [DEBUG] First valid draw processed:`, { concurso, data: formattedDate, dezenas });
            }
        } catch (error) {
            skippedRows++;
            if (validDraws === 0 && i < startRow + 5) {
                console.warn(`⚠️ [DEBUG] Row ${i} error:`, error.message);
            }
        }
    }

    console.log(`📊 [DEBUG] Processing complete: ${validDraws} valid, ${skippedRows} skipped`);

    if (validDraws === 0) {
        console.error('❌ [DEBUG] No valid draws found!');
        console.error('❌ [DEBUG] Total rows processed:', data.length - startRow);
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
