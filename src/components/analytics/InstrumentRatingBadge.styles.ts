import type { CSSProperties } from 'react';

export const getRatingBadgeStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color,
  cursor: 'help',
  lineHeight: 1,
});
