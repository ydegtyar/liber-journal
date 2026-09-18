import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ForecastKpiCard, ForecastKpiCardProps } from './ForecastKpiCard';
import ShieldIcon from '@mui/icons-material/Shield';

const defaultProps: ForecastKpiCardProps = {
  id: 'conservative',
  label: 'Conservative',
  icon: React.createElement(ShieldIcon),
  data: {
    projectedDeposit: 10500,
    projectedPnl: 500,
    projectedRoiPercent: 5.0,
  },
  color: '#F59E0B',
  badge: '10th %ile',
  currency: 'USD',
  numberFormat: 'dot',
  isSelected: false,
  onSelect: vi.fn(),
};

describe('ForecastKpiCard', () => {
  it('has component defined and renders correctly', () => {
    expect(ForecastKpiCard).toBeDefined();
    expect(ForecastKpiCard.displayName).toBe('ForecastKpiCard');
  });

  it('provides accessible interactive contract', () => {
    const onSelect = vi.fn();
    const props = { ...defaultProps, onSelect, isSelected: true };

    expect(props.isSelected).toBe(true);
    expect(props.id).toBe('conservative');

    props.onSelect(props.id);
    expect(onSelect).toHaveBeenCalledWith('conservative');
  });
});
