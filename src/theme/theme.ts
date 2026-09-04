import { createTheme, Theme } from '@mui/material/styles';
import { ThemeMode } from '../types/preferences';
import { lightPalette } from './palettes/light';
import { darkPalette } from './palettes/dark';
import { midnightPalette } from './palettes/midnight';
import { unicornPalette } from './palettes/unicorn';

declare module '@mui/material/styles' {
  interface Palette {
    trade: {
      gain: string;
      gainBg: string;
      gainBorder: string;
      loss: string;
      lossBg: string;
      lossBorder: string;
      breakeven: string;
      breakevenBg: string;
    };
  }
  interface PaletteOptions {
    trade?: {
      gain?: string;
      gainBg?: string;
      gainBorder?: string;
      loss?: string;
      lossBg?: string;
      lossBorder?: string;
      breakeven?: string;
      breakevenBg?: string;
    };
  }
}

export function buildAppTheme(mode: ThemeMode, systemMode: 'light' | 'dark' = 'dark'): Theme {
  let activePalette: any = darkPalette;

  if (mode === 'light') {
    activePalette = lightPalette;
  } else if (mode === 'dark') {
    activePalette = darkPalette;
  } else if (mode === 'midnight') {
    activePalette = midnightPalette;
  } else if (mode === 'unicorn') {
    activePalette = unicornPalette;
  } else if (mode === 'system') {
    activePalette = systemMode === 'light' ? lightPalette : darkPalette;
  }

  return createTheme({
    palette: activePalette,
    typography: {
      fontFamily: [
        'Geist',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `2px solid ${activePalette.primary.main}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${activePalette.divider}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.8125rem',
            padding: '8px 12px',
            borderBottom: `1px solid ${activePalette.divider}`,
          },
          head: {
            fontFamily: "'Geist', sans-serif",
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'none',
            color: activePalette.text.secondary,
            backgroundColor: activePalette.background.paper,
          },
        },
      },
    },
  });
}
