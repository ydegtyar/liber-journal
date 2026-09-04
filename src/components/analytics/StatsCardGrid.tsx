import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { JournalAnalytics } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { StatCard } from './StatCard';
import { formatCurrency, formatSignedPnl, formatPercent } from '../../lib/formatters';

interface StatsCardGridProps {
  analytics: JournalAnalytics;
  currency: string;
  numberFormat: NumberFormatOption;
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = ({
  analytics,
  currency,
  numberFormat,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en-US';

  const pnlFormatted = formatSignedPnl(analytics.netPnl, currency, numberFormat, currentLang);
  const pnlSentiment = pnlFormatted.isPositive
    ? 'positive'
    : pnlFormatted.isNegative
    ? 'negative'
    : 'neutral';

  const streakSentiment =
    analytics.currentStreak.type === 'win'
      ? 'positive'
      : analytics.currentStreak.type === 'loss'
      ? 'negative'
      : 'neutral';

  const streakNoun =
    analytics.currentStreak.type === 'win'
      ? 'wins'
      : analytics.currentStreak.type === 'loss'
      ? 'losses'
      : 'breakeven';

  const streakText =
    analytics.currentStreak.count > 0
      ? `${analytics.currentStreak.count} ${streakNoun}`
      : '-';

  return (
    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
      {/* Current Balance */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.currentDeposit')}
          value={formatCurrency(analytics.currentDeposit, currency, numberFormat, currentLang)}
          subValue={`ROI: ${formatPercent(analytics.roiPercent, 2, numberFormat, currentLang)}`}
          sentiment="accent"
        />
      </Grid>

      {/* Net PnL */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.netPnl')}
          value={pnlFormatted.text}
          subValue={`${analytics.totalTrades} trades total`}
          sentiment={pnlSentiment}
        />
      </Grid>

      {/* Win Rate (Excl. BE) */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.winRate')}
          value={formatPercent(analytics.winRate, 1, numberFormat, currentLang)}
          subValue={`W: ${analytics.winningTrades} | L: ${analytics.losingTrades}`}
          sentiment={analytics.winRate >= 50 ? 'positive' : 'negative'}
          circularProgress={analytics.winRate}
        />
      </Grid>

      {/* Breakeven Trades (Dedicated BE Card) */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.breakevenTrades')}
          value={`${analytics.breakevenTrades}`}
          subValue={`${formatPercent(analytics.breakevenRate, 1, numberFormat, currentLang)} of total trades`}
          sentiment="neutral"
        />
      </Grid>

      {/* Profit Factor */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.profitFactor')}
          value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          subValue={`Avg W/L: ${formatCurrency(analytics.avgWin, currency, numberFormat, currentLang)} / ${formatCurrency(analytics.avgLoss, currency, numberFormat, currentLang)}`}
          sentiment={analytics.profitFactor >= 1.5 ? 'positive' : analytics.profitFactor < 1 ? 'negative' : 'neutral'}
        />
      </Grid>

      {/* Expectancy */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.expectancy')}
          value={formatCurrency(analytics.expectancy, currency, numberFormat, currentLang)}
          subValue="Expected $ per trade"
          sentiment={analytics.expectancy > 0 ? 'positive' : analytics.expectancy < 0 ? 'negative' : 'neutral'}
        />
      </Grid>

      {/* Max Drawdown */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.maxDrawdown')}
          value={`-${formatCurrency(analytics.maxDrawdownAmount, currency, numberFormat, currentLang)}`}
          subValue={`-${formatPercent(analytics.maxDrawdownPercent, 1, numberFormat, currentLang)} peak-to-trough`}
          sentiment={analytics.maxDrawdownAmount > 0 ? 'negative' : 'neutral'}
        />
      </Grid>

      {/* Current Streak */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.currentStreak')}
          value={streakText}
          subValue="Latest closed sequence"
          sentiment={streakSentiment}
        />
      </Grid>

      {/* Best Asset */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.bestInstrument')}
          value={analytics.bestInstrument?.symbol || '-'}
          subValue={
            analytics.bestInstrument
              ? `+${formatCurrency(analytics.bestInstrument.pnl, currency, numberFormat, currentLang)}`
              : undefined
          }
          sentiment="positive"
        />
      </Grid>

      {/* Worst Asset */}
      <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
        <StatCard
          title={t('stats.worstInstrument')}
          value={analytics.worstInstrument?.symbol || '-'}
          subValue={
            analytics.worstInstrument
              ? formatCurrency(analytics.worstInstrument.pnl, currency, numberFormat, currentLang)
              : undefined
          }
          sentiment={analytics.worstInstrument && analytics.worstInstrument.pnl < 0 ? 'negative' : 'neutral'}
        />
      </Grid>
    </Grid>
  );
};
