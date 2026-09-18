import React from 'react';
import { Box, Paper, Typography, Chip, useTheme, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTranslation } from 'react-i18next';
import { ForecastScenarioId, ForecastScenarioSummary } from '../../types/forecast';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';

export interface ForecastKpiCardProps {
  id: ForecastScenarioId;
  label: string;
  icon: React.ReactNode;
  data: ForecastScenarioSummary;
  color: string;
  badge: string;
  currency: string;
  numberFormat: NumberFormatOption;
  isSelected: boolean;
  onSelect: (scenario: ForecastScenarioId) => void;
}

/**
 * Individual scenario forecast card.
 * Designed with fixed 1px borders and box-shadow selection to completely
 * prevent layout/content shifts on click or hover.
 */
export const ForecastKpiCard: React.FC<ForecastKpiCardProps> = React.memo(
  ({ id, label, icon, data, color, badge, currency, numberFormat, isSelected, onSelect }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const isDark = theme.palette.mode === 'dark';
    const gainColor = theme.palette.trade.gain;
    const lossColor = theme.palette.trade.loss;
    const isPnlPositive = data.projectedPnl >= 0;

    return (
      <Paper
        variant="outlined"
        onClick={() => onSelect(id)}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(id);
          }
        }}
        sx={{
          p: 2,
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: isSelected ? color : 'divider',
          boxShadow: isSelected
            ? `0 0 0 1px ${color}, ${isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(0,0,0,0.06)'}`
            : 'none',
          backgroundColor: isSelected ? alpha(color, isDark ? 0.08 : 0.04) : 'background.paper',
          // Strictly transition colors and shadows to prevent layout reflow/content shifts
          transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            borderColor: color,
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.05)',
          },
          '&:focus-visible': {
            outline: `2px solid ${color}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
              {label}
            </Typography>
          </Box>
          <Chip
            label={badge}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              height: 20,
              backgroundColor: alpha(color, 0.12),
              color,
            }}
          />
        </Box>

        {/* Projected Deposit Balance */}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('forecast.kpis.projectedDeposit')}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.02em',
            mt: 0.25,
            mb: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(data.projectedDeposit, currency, numberFormat)}
        </Typography>

        {/* Projected Net P&L and ROI */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1,
            borderTop: (th) => `1px dashed ${th.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPnlPositive ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: gainColor }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: lossColor }} />
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: isPnlPositive ? gainColor : lossColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {isPnlPositive ? '+' : ''}
              {formatCurrency(data.projectedPnl, currency, numberFormat)}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              backgroundColor: alpha(isPnlPositive ? gainColor : lossColor, 0.1),
              color: isPnlPositive ? gainColor : lossColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {isPnlPositive ? '+' : ''}
            {data.projectedRoiPercent}% ROI
          </Typography>
        </Box>
      </Paper>
    );
  }
);

ForecastKpiCard.displayName = 'ForecastKpiCard';
