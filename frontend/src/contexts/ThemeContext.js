import React, { createContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

export const ThemeContext = createContext({
  toggleTheme: () => {},
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2e7d32' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#66bb6a' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  const themeHelpers = useMemo(
    () => ({
      toggleTheme: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={themeHelpers}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
