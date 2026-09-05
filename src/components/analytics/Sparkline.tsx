import React from 'react';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export interface SparklineProps {
  points: number[];
  isPositive: boolean;
}

export const Sparkline: React.FC<SparklineProps> = React.memo(({ points, isPositive }) => {
  if (points.length < 2) {
    return <ShowChartIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
  }

  const width = 80;
  const height = 22;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((val - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';
