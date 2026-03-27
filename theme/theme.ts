import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul profesional
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#757575', // Gris neutro
      light: '#9e9e9e',
      dark: '#616161',
    },
    background: {
      default: '#fafafa', // Fondo claro
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
  },
});

export default theme;