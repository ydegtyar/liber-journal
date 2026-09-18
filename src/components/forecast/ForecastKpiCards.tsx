import React from 'react';
import { Box, Typography, Grid, Chip, useTheme } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import BoltIcon from '@mui/icons-material/Bolt';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useTranslation } from 'react-i18next';
import { ForecastResult, ForecastScenarioId } from '../../types/forecast';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';
import { ForecastKpiCard } from './ForecastKpiCard';

interface Props {
  forecast: ForecastResult;
  currency: string;
  numberFormat: NumberFormatOption;
  selectedScenario: ForecastScenarioId;
  onSelectScenario: (scenario: ForecastScenarioId) => void;
}

export const ForecastKpiCards: React.FC<Props> = React.memo(
  ({ forecast, currency, numberFormat, selectedScenario, onSelectScenario }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const gainColor = theme.palette.trade.gain;
    const primaryColor = theme.palette.primary.main;

    const scenarios = [
      {
        id: 'conservative' as const,
        label: t('forecast.scenarios.conservative'),
        icon: <ShieldIcon sx={{ fontSize: 18 }} />,
        data: forecast.conservative,
        color: '#F59E0B', // Amber
        badge: '10th %ile',
      },
      {
        id: 'average' as const,
        label: t('forecast.scenarios.average'),
        icon: <BoltIcon sx={{ fontSize: 18 }} />,
        data: forecast.average,
        color: primaryColor,
        badge: '50th %ile (Median)',
      },
      {
        id: 'optimistic' as const,
        label: t('forecast.scenarios.optimistic'),
        icon: <RocketLaunchIcon sx={{ fontSize: 18 }} />,
        data: forecast.optimistic,
        color: gainColor,
        badge: '90th %ile',
      },
    ];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          {scenarios.map(({ id, label, icon, data, color, badge }) => (
            <Grid item xs={12} sm={4} key={id}>
              <ForecastKpiCard
                id={id}
                label={label}
                icon={icon}
                data={data}
                color={color}
                badge={badge}
                currency={currency}
                numberFormat={numberFormat}
                isSelected={selectedScenario === id}
                onSelect={onSelectScenario}
              />
            </Grid>
          ))}
        </Grid>

        {/* Secondary Metrics Bar: Probability of Profit & Drawdown Risk */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            px: 2,
            py: 1.25,
            borderRadius: 1.5,
            backgroundColor: (th) =>
              th.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: (th) => `1px solid ${th.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {t('forecast.kpis.currentBaseline')}:
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(forecast.currentDeposit, currency, numberFormat)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {t('forecast.kpis.winProbability')}:
              </Typography>
              <Chip
                size="small"
                label={`${forecast.probabilityOfProfit}%`}
                color={
                  forecast.probabilityOfProfit >= 60
                    ? 'success'
                    : forecast.probabilityOfProfit >= 45
                      ? 'warning'
                      : 'error'
                }
                sx={{ fontWeight: 800, height: 22, fontSize: '0.75rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {t('forecast.kpis.estimatedDrawdown')}:
              </Typography>
              <Chip
                size="small"
                label={`${forecast.estimatedMaxDrawdownPercent}%`}
                color={
                  forecast.estimatedMaxDrawdownPercent <= 10
                    ? 'success'
                    : forecast.estimatedMaxDrawdownPercent <= 25
                      ? 'warning'
                      : 'error'
                }
                sx={{ fontWeight: 800, height: 22, fontSize: '0.75rem' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);

ForecastKpiCards.displayName = 'ForecastKpiCards';
