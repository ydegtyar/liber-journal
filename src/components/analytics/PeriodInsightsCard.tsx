import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useTranslation } from 'react-i18next';
import { PeriodInsight } from '../../types/trade';

interface Props {
  insights: PeriodInsight[];
}

export const PeriodInsightsCard: React.FC<Props> = React.memo(({ insights }) => {
  const { t } = useTranslation();

  if (insights.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
        <AutoAwesomeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.78rem',
            color: 'text.secondary',
          }}
        >
          {t('insights.title', { defaultValue: 'Інсайти за період' })}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {insights.map((insight) => (
          <Box
            key={insight.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.5,
              px: 1,
              borderRadius: 1,
              backgroundColor: (theme) =>
                insight.type === 'positive' || insight.type === 'highlight'
                  ? theme.palette.trade.gainBg
                  : insight.type === 'negative'
                    ? theme.palette.trade.lossBg
                    : 'action.hover',
            }}
          >
            <ArrowDropUpIcon
              sx={{
                fontSize: 20,
                color: (theme) =>
                  insight.type === 'positive' || insight.type === 'highlight'
                    ? theme.palette.trade.gain
                    : insight.type === 'negative'
                      ? theme.palette.trade.loss
                      : 'primary.main',
                transform: insight.type === 'negative' ? 'rotate(180deg)' : 'none',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: (theme) =>
                  insight.type === 'positive' || insight.type === 'highlight'
                    ? theme.palette.trade.gain
                    : insight.type === 'negative'
                      ? theme.palette.trade.loss
                      : 'text.primary',
              }}
            >
              {insight.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

PeriodInsightsCard.displayName = 'PeriodInsightsCard';
