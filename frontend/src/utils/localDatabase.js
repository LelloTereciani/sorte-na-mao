const STORAGE_KEY = 'megasena_database';
const METADATA_KEY = 'megasena_metadata';

/**
 * Save database to localStorage
 * @param {Object} data - Database object with draws and metadata
 * @returns {boolean} Success status
 */
export const saveDatabase = (data) => {
    try {
        // Save draws
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.draws));

        // Save metadata
        localStorage.setItem(METADATA_KEY, JSON.stringify(data.metadata));

        console.log(`✅ Base de dados salva: ${data.draws.length} sorteios`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar base de dados:', error);

        // Check if quota exceeded
        if (error.name === 'QuotaExceededError') {
            throw new Error('Espaço de armazenamento insuficiente. Limpe o cache do navegador.');
        }

        throw new Error(`Erro ao salvar: ${error.message}`);
    }
};

/**
 * Load database from localStorage
 * @returns {Object|null} Database object or null if not found
 */
export const loadDatabase = () => {
    try {
        const drawsStr = localStorage.getItem(STORAGE_KEY);
        const metadataStr = localStorage.getItem(METADATA_KEY);

        if (!drawsStr || !metadataStr) {
            console.log('ℹ️ Nenhuma base de dados local encontrada');
            return null;
        }

        const draws = JSON.parse(drawsStr);
        const metadata = JSON.parse(metadataStr);

        console.log(`✅ Base de dados carregada: ${draws.length} sorteios`);

        return { draws, metadata };
    } catch (error) {
        console.error('❌ Erro ao carregar base de dados:', error);
        return null;
    }
};

/**
 * Delete database from localStorage
 * @returns {boolean} Success status
 */
export const deleteDatabase = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(METADATA_KEY);

        console.log('✅ Base de dados deletada');
        return true;
    } catch (error) {
        console.error('❌ Erro ao deletar base de dados:', error);
        return false;
    }
};

/**
 * Get database info/metadata
 * @returns {Object|null} Metadata object or null
 */
export const getDatabaseInfo = () => {
    try {
        const metadataStr = localStorage.getItem(METADATA_KEY);

        if (!metadataStr) {
            return null;
        }

        return JSON.parse(metadataStr);
    } catch (error) {
        console.error('❌ Erro ao obter informações da base:', error);
        return null;
    }
};

/**
 * Check if database exists
 * @returns {boolean} True if database exists
 */
export const databaseExists = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Get storage size in bytes
 * @returns {number} Approximate size in bytes
 */
export const getStorageSize = () => {
    try {
        const drawsStr = localStorage.getItem(STORAGE_KEY);
        const metadataStr = localStorage.getItem(METADATA_KEY);

        if (!drawsStr || !metadataStr) {
            return 0;
        }

        // Approximate size (UTF-16 encoding, 2 bytes per character)
        return (drawsStr.length + metadataStr.length) * 2;
    } catch (error) {
        return 0;
    }
};

/**
 * Format storage size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatStorageSize = (bytes) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Get latest draw from database
 * @returns {Object|null} Latest draw or null
 */
export const getLatestDraw = () => {
    try {
        const data = loadDatabase();
        if (!data || !data.draws || data.draws.length === 0) {
            return null;
        }

        return data.draws[data.draws.length - 1];
    } catch (error) {
        console.error('❌ Erro ao obter último sorteio:', error);
        return null;
    }
};

/**
 * Get draws within a specific range
 * @param {number} lastN - Number of last draws to get (optional)
 * @returns {Array} Array of draws
 */
export const getDraws = (lastN = null) => {
    try {
        const data = loadDatabase();
        if (!data || !data.draws) {
            return [];
        }

        if (lastN && lastN > 0) {
            return data.draws.slice(-lastN);
        }

        return data.draws;
    } catch (error) {
        console.error('❌ Erro ao obter sorteios:', error);
        return [];
    }
};

export default {
    saveDatabase,
    loadDatabase,
    deleteDatabase,
    getDatabaseInfo,
    databaseExists,
    getStorageSize,
    formatStorageSize,
    getLatestDraw,
    getDraws
};
