import React from 'react';

export interface Props {
  progress: number;
  sentiment: string;
}

export const CircularRing: React.FC<Props> = React.memo(({ progress, sentiment }) => {
  const size = 26;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference - (normalizedProgress / 100) * circumference;

  const color =
    sentiment === 'positive' ? '#10b981' : sentiment === 'negative' ? '#ef4444' : '#3b82f6';

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
});

CircularRing.displayName = 'CircularRing';
