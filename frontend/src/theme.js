import { createTheme } from '@mui/material/styles';

// Tema customizado para Sorte na Mão - Mega-Sena
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E8449', // Verde Mega-Sena
      light: '#2ECC71',
      dark: '#145A32',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFD700', // Dourado
      light: '#FFE44D',
      dark: '#CCAC00',
      contrastText: '#000000',
    },
    success: {
      main: '#27AE60',
    },
    error: {
      main: '#E74C3C',
    },
    warning: {
      main: '#F39C12',
    },
    info: {
      main: '#3498DB',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove MAIÚSCULAS automáticas
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
