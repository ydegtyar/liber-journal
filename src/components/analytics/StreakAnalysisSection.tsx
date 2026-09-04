import React from 'react';
import { Paper, Typography, Box, Grid2 as Grid } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import { StreakAnalysis } from '../../types/trade';

interface StreakAnalysisSectionProps {
  streakAnalysis: StreakAnalysis;
}

export const StreakAnalysisSection: React.FC<StreakAnalysisSectionProps> = ({ streakAnalysis }) => {
  const { t } = useTranslation();

  const isCurrentWin = streakAnalysis.currentStreak.type === 'win';
  const isCurrentLoss = streakAnalysis.currentStreak.type === 'loss';

  const currentStreakLabel =
    streakAnalysis.currentStreak.count > 0
      ? isCurrentWin
        ? t('streaks.winningStreak', { defaultValue: 'Виграшна серія' })
        : isCurrentLoss
        ? t('streaks.losingStreak', { defaultValue: 'Програшна серія' })
        : t('streaks.breakevenStreak', { defaultValue: 'Безубиткова серія' })
      : '—';

  const cards = [
    {
      id: 'longestWin',
      title: t('streaks.longestWin', { defaultValue: 'Найдовша серія виграшів' }),
      value: streakAnalysis.maxWinStreak,
      color: (theme: any) => theme.palette.trade.gain,
      subtitle: t('streaks.longestWinSub', { defaultValue: 'Макс. позитивних угод підряд' }),
    },
    {
      id: 'longestLoss',
      title: t('streaks.longestLoss', { defaultValue: 'Найдовша серія збитків' }),
      value: streakAnalysis.maxLossStreak,
      color: (theme: any) =>
        streakAnalysis.maxLossStreak > 0 ? theme.palette.trade.loss : theme.palette.text.primary,
      subtitle: t('streaks.longestLossSub', { defaultValue: 'Макс. негативних угод підряд' }),
    },
    {
      id: 'currentStreak',
      title: t('streaks.currentStreak', { defaultValue: 'Поточна серія' }),
      value: streakAnalysis.currentStreak.count,
      icon: isCurrentWin ? (
        <TrendingUpIcon sx={{ color: 'trade.gain', fontSize: 18 }} />
      ) : isCurrentLoss ? (
        <TrendingDownIcon sx={{ color: 'trade.loss', fontSize: 18 }} />
      ) : (
        <RemoveIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
      ),
      color: (theme: any) =>
        isCurrentWin
          ? theme.palette.trade.gain
          : isCurrentLoss
          ? theme.palette.trade.loss
          : theme.palette.text.primary,
      subtitle: currentStreakLabel,
    },
    {
      id: 'avgWin',
      title: t('streaks.avgWin', { defaultValue: 'Середня серія виграшів' }),
      value: streakAnalysis.avgWinStreak.toFixed(1),
      color: (theme: any) => theme.palette.trade.gain,
      subtitle: t('streaks.avgWinSub', { defaultValue: 'Типова довжина виграшної серії' }),
    },
    {
      id: 'avgLoss',
      title: t('streaks.avgLoss', { defaultValue: 'Середня серія збитків' }),
      value: streakAnalysis.avgLossStreak.toFixed(1),
      color: (theme: any) =>
        streakAnalysis.avgLossStreak > 0 ? theme.palette.trade.loss : theme.palette.text.primary,
      subtitle: t('streaks.avgLossSub', { defaultValue: 'Типова довжина програшної серії' }),
    },
    {
      id: 'stability',
      title: t('streaks.stability', { defaultValue: 'Стійкість результатів' }),
      value: streakAnalysis.streakRatio.toFixed(2),
      color: (theme: any) =>
        streakAnalysis.streakRatio >= 2
          ? theme.palette.trade.gain
          : streakAnalysis.streakRatio >= 1
          ? theme.palette.text.primary
          : theme.palette.trade.loss,
      subtitle: t('streaks.stabilitySub', { defaultValue: 'Співвідношення серій' }),
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        py: 1.5,
        px: 2,
        mb: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
        <TimelineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.78rem',
            color: 'text.secondary',
          }}
        >
          {t('streaks.title', { defaultValue: 'Аналіз серій угод' })}
        </Typography>
      </Box>

      {/* 6 Cards Grid - condensed into a single row on md+ */}
      <Grid container spacing={1.25}>
        {cards.map((card) => (
          <Grid key={card.id} size={{ xs: 6, sm: 4, md: 2 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) => theme.palette.background.default,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={card.title}
              >
                {card.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, my: 0.25 }}>
                {card.icon}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    lineHeight: 1.2,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: card.color,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.68rem',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: 0.85,
                }}
                title={card.subtitle}
              >
                {card.subtitle}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
