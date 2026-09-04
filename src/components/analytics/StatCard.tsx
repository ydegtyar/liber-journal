import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'accent';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  sentiment = 'neutral',
  icon,
}) => {
  return (
    <Paper
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: (theme) => {
          if (sentiment === 'positive') return `3px solid ${theme.palette.trade.gain}`;
          if (sentiment === 'negative') return `3px solid ${theme.palette.trade.loss}`;
          if (sentiment === 'accent') return `3px solid ${theme.palette.primary.main}`;
          return `1px solid ${theme.palette.divider}`;
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>
        {icon && <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>{icon}</Box>}
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
          fontSize: '1.2rem',
          lineHeight: 1.2,
          color: (theme) => {
            if (sentiment === 'positive') return theme.palette.trade.gain;
            if (sentiment === 'negative') return theme.palette.trade.loss;
            return theme.palette.text.primary;
          },
        }}
      >
        {value}
      </Typography>

      {subValue && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.72rem',
            fontFamily: "'JetBrains Mono', monospace",
            mt: 0.5,
          }}
        >
          {subValue}
        </Typography>
      )}
    </Paper>
  );
};
