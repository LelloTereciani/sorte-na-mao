import React, { createContext, useState, useEffect, useContext } from 'react';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  }
  return context;
};

export function ConfigProvider({ children }) {
  const [ticketPrice, setTicketPrice] = useState(() => {
    const saved = localStorage.getItem('megasena_ticket_price');
    return saved ? parseFloat(saved) : 5.00;
  });

  useEffect(() => {
    localStorage.setItem('megasena_ticket_price', ticketPrice.toString());
  }, [ticketPrice]);

  const calculatePrice = (numbersCount) => {
    const multipliers = {
      6: 1, 7: 7, 8: 28, 9: 84, 10: 210,
      11: 462, 12: 924, 13: 1716, 14: 3003, 15: 5005,
      16: 8008, 17: 12376, 18: 18564, 19: 27132, 20: 38760,
    };
    return ticketPrice * (multipliers[numbersCount] || 1);
  };

  const value = {
    ticketPrice,
    setTicketPrice,
    calculatePrice,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
