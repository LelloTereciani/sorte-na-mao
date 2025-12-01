import React, { createContext, useState, useEffect, useContext } from 'react';

const ConfigContext = createContext();

const DEFAULT_PRICE_TABLE = {
  6: 6.00, 7: 42.00, 8: 168.00, 9: 504.00,
  10: 1260.00, 11: 2772.00, 12: 5544.00, 13: 10296.00,
  14: 18018.00, 15: 30030.00, 16: 48048.00, 17: 74256.00,
  18: 111384.00, 19: 162792.00, 20: 232560.00,
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  }
  return context;
};

export function ConfigProvider({ children }) {
  const [priceTable, setPriceTable] = useState(() => {
    const saved = localStorage.getItem('megasena_price_table');
    return saved ? JSON.parse(saved) : DEFAULT_PRICE_TABLE;
  });

  useEffect(() => {
    localStorage.setItem('megasena_price_table', JSON.stringify(priceTable));
  }, [priceTable]);

  const calculatePrice = (numbersCount) => {
    return priceTable[numbersCount] || 0;
  };

  const updatePrice = (numbersCount, newPrice) => {
    setPriceTable(prev => ({
      ...prev,
      [numbersCount]: parseFloat(newPrice)
    }));
  };

  const resetPrices = () => {
    setPriceTable(DEFAULT_PRICE_TABLE);
  };

  const value = {
    priceTable,
    setPriceTable,
    calculatePrice,
    updatePrice,
    resetPrices,
    DEFAULT_PRICE_TABLE,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
