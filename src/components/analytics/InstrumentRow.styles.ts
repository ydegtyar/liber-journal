import type { CSSProperties } from 'react';
import type { Theme } from '@mui/material/styles';

export const getRowSx = (isSelected: boolean) => ({
  cursor: 'pointer',
  backgroundColor: isSelected ? 'action.selected' : 'inherit',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: isSelected ? 'action.selected' : 'action.hover',
  },
  '&:focus-visible': {
    outline: (theme: Theme) => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: -2,
  },
});

export const styles = {
  symbolCell: {
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  },
  tradesCell: {
    textAlign: 'right',
  },
  durationCell: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
  },
  shareCell: {
    fontSize: '0.8rem',
  },
} as const satisfies Record<string, CSSProperties>;
