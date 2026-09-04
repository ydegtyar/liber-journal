import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'accent';
  icon?: React.ReactNode;
  circularProgress?: number; // 0 - 100 percentage
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  sentiment = 'neutral',
  icon,
  circularProgress,
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
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.75rem',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {icon && <Box sx={{ color: 'text.secondary', opacity: 0.5, display: 'flex' }}>{icon}</Box>}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {circularProgress !== undefined && (
          <CircularRing progress={circularProgress} sentiment={sentiment} />
        )}
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
      </Box>

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

const CircularRing: React.FC<{ progress: number; sentiment: string }> = ({ progress, sentiment }) => {
  const size = 26;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference - (normalizedProgress / 100) * circumference;

  const color =
    sentiment === 'positive'
      ? '#10b981'
      : sentiment === 'negative'
      ? '#ef4444'
      : '#3b82f6';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(128, 128, 128, 0.2)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};
