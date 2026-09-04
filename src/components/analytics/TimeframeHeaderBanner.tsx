import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  ButtonGroup,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';
import { TimeframeOption } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatSignedPnl, formatPercent, formatCurrency } from '../../lib/formatters';

interface TimeframeHeaderBannerProps {
  netPnl: number;
  roiPercent: number;
  tradeCount: number;
  currency: string;
  numberFormat: NumberFormatOption;
  dateRangeLabel: string;
  timeframe: TimeframeOption;
  onSelectTimeframe: (tf: TimeframeOption) => void;
  selectedInstrument: string | null;
  onClearInstrument: () => void;
  monthlyGoal?: number;
  onUpdateMonthlyGoal: (goal: number) => void;
  customStartDate: string;
  customEndDate: string;
  onUpdateCustomRange: (start: string, end: string) => void;
}

export const TimeframeHeaderBanner: React.FC<TimeframeHeaderBannerProps> = ({
  netPnl,
  roiPercent,
  tradeCount,
  currency,
  numberFormat,
  dateRangeLabel,
  timeframe,
  onSelectTimeframe,
  selectedInstrument,
  onClearInstrument,
  monthlyGoal = 0,
  onUpdateMonthlyGoal,
  customStartDate,
  customEndDate,
  onUpdateCustomRange,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en-US';

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(monthlyGoal > 0 ? String(monthlyGoal) : '');

  const [customRangeDialogOpen, setCustomRangeDialogOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState(customStartDate);
  const [endDateInput, setEndDateInput] = useState(customEndDate);

  const pnlData = formatSignedPnl(netPnl, currency, numberFormat, currentLang);
  const roiText = formatPercent(roiPercent, 2, numberFormat, currentLang);

  const handleSaveGoal = () => {
    const val = parseFloat(goalInput);
    onUpdateMonthlyGoal(isNaN(val) || val < 0 ? 0 : val);
    setGoalDialogOpen(false);
  };

  const handleSaveCustomRange = () => {
    onUpdateCustomRange(startDateInput, endDateInput);
    onSelectTimeframe('CUSTOM');
    setCustomRangeDialogOpen(false);
  };

  const timeframeButtons: Array<{ id: TimeframeOption; label: string }> = [
    { id: '1D', label: '1D' },
    { id: '7D', label: '7D' },
    { id: '30D', label: '30D' },
    { id: 'WTD', label: 'WTD' },
    { id: 'MTD', label: 'M' },
    { id: 'YTD', label: 'YTD' },
    { id: 'ALL', label: 'ALL' },
  ];

  const goalProgress =
    monthlyGoal > 0 ? Math.min(Math.max((netPnl / monthlyGoal) * 100, 0), 100) : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      {/* Left: Overall PnL & Stats */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'text.secondary',
            }}
          >
            {t('banner.totalProfit', { defaultValue: 'Загальний прибуток' })} {dateRangeLabel}
          </Typography>

          {selectedInstrument && (
            <Chip
              size="small"
              label={`${t('table.instrument')}: ${selectedInstrument}`}
              onDelete={onClearInstrument}
              color="primary"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.02em',
              color: (theme) =>
                pnlData.isPositive
                  ? theme.palette.trade.gain
                  : pnlData.isNegative
                  ? theme.palette.trade.loss
                  : theme.palette.trade.breakeven,
            }}
          >
            {pnlData.text}
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: (theme) =>
                roiPercent > 0
                  ? theme.palette.trade.gain
                  : roiPercent < 0
                  ? theme.palette.trade.loss
                  : 'text.secondary',
            }}
          >
            {roiPercent >= 0 ? `+${roiText}` : roiText}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {tradeCount} {t('banner.tradesCount', { defaultValue: 'угод' })}
          </Typography>
        </Box>

        {/* Monthly Goal Tracker */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          {monthlyGoal > 0 ? (
            <Box
              onClick={() => {
                setGoalInput(String(monthlyGoal));
                setGoalDialogOpen(true);
              }}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                py: 0.25,
                px: 1,
                borderRadius: 1,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <FlagIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t('banner.goal')}: {pnlData.text} / {formatCurrency(monthlyGoal, currency, numberFormat, currentLang)} ({goalProgress.toFixed(0)}%)
              </Typography>
              <Box sx={{ width: 60, ml: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={goalProgress}
                  color={pnlData.isPositive ? 'success' : 'inherit'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          ) : (
            <Button
              size="small"
              variant="text"
              startIcon={<FlagIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setGoalInput('');
                setGoalDialogOpen(true);
              }}
              sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25, px: 0.75, color: 'text.secondary' }}
            >
              + {t('banner.setMonthGoal', { defaultValue: 'Задати ціль місяця' })}
            </Button>
          )}
        </Box>
      </Box>

      {/* Right: Quick Timeframe Pills & Custom Range */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <ButtonGroup size="small" variant="outlined">
          {timeframeButtons.map((btn) => (
            <Button
              key={btn.id}
              onClick={() => onSelectTimeframe(btn.id)}
              variant={timeframe === btn.id ? 'contained' : 'outlined'}
              sx={{
                px: 1.2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                minWidth: 40,
              }}
            >
              {btn.label}
            </Button>
          ))}
        </ButtonGroup>

        <Tooltip title={t('banner.customRange', { defaultValue: 'Свій діапазон' })}>
          <IconButton
            size="small"
            color={timeframe === 'CUSTOM' ? 'primary' : 'default'}
            onClick={() => setCustomRangeDialogOpen(true)}
            sx={{
              border: (theme) => `1px solid ${timeframe === 'CUSTOM' ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 1,
              p: 0.6,
            }}
          >
            <CalendarMonthIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
          {t('banner.setMonthGoal', { defaultValue: 'Задати ціль місяця' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('banner.goalDescription', {
              defaultValue: 'Вкажіть цільовий прибуток для відстеження прогресу за місяць.',
            })}
          </Typography>
          <TextField
            autoFocus
            type="number"
            label={`${t('banner.targetProfit', { defaultValue: 'Цільовий прибуток' })} (${currency})`}
            fullWidth
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            slotProps={{
              htmlInput: { min: 0, step: 50 },
            }}
          />
        </DialogContent>
        <DialogActions>
          {monthlyGoal > 0 && (
            <Button
              color="error"
              onClick={() => {
                onUpdateMonthlyGoal(0);
                setGoalDialogOpen(false);
              }}
            >
              {t('common.clear', { defaultValue: 'Очистити' })}
            </Button>
          )}
          <Button onClick={() => setGoalDialogOpen(false)}>{t('common.cancel', { defaultValue: 'Скасувати' })}</Button>
          <Button variant="contained" onClick={handleSaveGoal}>
            {t('common.save', { defaultValue: 'Зберегти' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Range Dialog */}
      <Dialog open={customRangeDialogOpen} onClose={() => setCustomRangeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('banner.customRange', { defaultValue: 'Свій діапазон' })}
          <IconButton size="small" onClick={() => setCustomRangeDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              type="date"
              label={t('banner.startDate', { defaultValue: 'Дата початку' })}
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              type="date"
              label={t('banner.endDate', { defaultValue: 'Дата кінця' })}
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomRangeDialogOpen(false)}>{t('common.cancel', { defaultValue: 'Скасувати' })}</Button>
          <Button variant="contained" onClick={handleSaveCustomRange}>
            {t('common.save', { defaultValue: 'Застосувати' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
