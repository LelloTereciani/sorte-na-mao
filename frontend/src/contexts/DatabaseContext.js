import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDatabase, saveDatabase, deleteDatabase as deleteDB, getDatabaseInfo } from '../utils/localDatabase';

const DatabaseContext = createContext();

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within DatabaseProvider');
    }
    return context;
};

export const DatabaseProvider = ({ children }) => {
    const [database, setDatabase] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [error, setError] = useState(null);

    // Load database on mount
    useEffect(() => {
        loadDatabaseFromStorage();
    }, []);

    const loadDatabaseFromStorage = () => {
        try {
            const data = loadDatabase();
            if (data) {
                setDatabase(data.draws);
                setMetadata(data.metadata);
                setIsLoaded(true);
                console.log('✅ Base de dados carregada do localStorage');
            } else {
                setIsLoaded(false);
                console.log('ℹ️ Nenhuma base de dados encontrada');
            }
            setError(null);
        } catch (err) {
            setError(err.message);
            setIsLoaded(false);
            console.error('❌ Erro ao carregar base:', err);
        }
    };

    const updateDatabase = (newData) => {
        try {
            saveDatabase(newData);
            setDatabase(newData.draws);
            setMetadata(newData.metadata);
            setIsLoaded(true);
            setError(null);
            console.log('✅ Base de dados atualizada');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteDatabase = () => {
        try {
            deleteDB();
            setDatabase(null);
            setMetadata(null);
            setIsLoaded(false);
            setError(null);
            console.log('✅ Base de dados deletada');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const getDrawsInRange = (lastN = null) => {
        if (!database) return [];

        if (lastN && lastN > 0) {
            return database.slice(-lastN);
        }

        return database;
    };

    const getLatestDraw = () => {
        if (!database || database.length === 0) return null;
        return database[database.length - 1];
    };

    const getPreviousDraws = (count = 5) => {
        if (!database || database.length === 0) return [];
        const endIndex = database.length - 1;
        const startIndex = Math.max(0, endIndex - count);
        return database.slice(startIndex, endIndex);
    };

    const value = {
        database,
        isLoaded,
        metadata,
        error,
        loadDatabaseFromStorage,
        updateDatabase,
        deleteDatabase,
        getDrawsInRange,
        getLatestDraw,
        getPreviousDraws,
        totalDraws: metadata?.totalDraws || 0,
        lastUpdated: metadata?.lastUpdated || null,
        firstDraw: metadata?.firstDraw || null,
        lastDraw: metadata?.lastDraw || null
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
};

export default DatabaseContext;
