import { createTheme } from '@mui/material/styles';

// PUBLIC_INTERFACE
/**
 * Application theme configured with brand colors and light/dark mode support.
 * Colors:
 *  - primary: #080808
 *  - secondary: #746d6d
 *  - accent: #ff6600 (mapped to warning for built-in components; also exposed as custom)
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#080808',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#746d6d',
    },
    warning: {
      main: '#ff6600',
    },
    background: {
      default: '#f7f7f7',
      paper: '#ffffff',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Extend the theme type to include a custom accent property if needed
declare module '@mui/material/styles' {
  interface Palette {
    accent?: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

export default theme;
