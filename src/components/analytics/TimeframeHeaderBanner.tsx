import React, { useState, useCallback } from 'react';
import { Paper, Typography, Chip, LinearProgress, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import FlagIcon from '@mui/icons-material/Flag';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';
import { TimeframeOption } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatSignedPnl, formatPercent, formatCurrency } from '../../lib/formatters';
import { DepositEditor } from '../deposit/DepositEditor';
import { GoalDialog } from './GoalDialog';

const CustomRangePickerDialog = React.lazy(() =>
  import('./CustomRangePickerDialog').then((m) => ({ default: m.CustomRangePickerDialog }))
);

interface Props {
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
  initialDeposit: number;
  onUpdateDeposit: (amount: number) => void;
}

const TIMEFRAME_BUTTONS: Array<{ id: TimeframeOption; label: string }> = [
  { id: '1D', label: '1D' },
  { id: '7D', label: '7D' },
  { id: '30D', label: '30D' },
  { id: 'WTD', label: 'WTD' },
  { id: 'MTD', label: 'M' },
  { id: 'YTD', label: 'YTD' },
  { id: 'ALL', label: 'ALL' },
];

export const TimeframeHeaderBanner: React.FC<Props> = React.memo(
  ({
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
    initialDeposit,
    onUpdateDeposit,
  }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en-US';

    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [customRangeDialogOpen, setCustomRangeDialogOpen] = useState(false);

    const pnlData = formatSignedPnl(netPnl, currency, numberFormat, currentLang);
    const roiText = formatPercent(roiPercent, 2, numberFormat, currentLang);

    const handleOpenGoalDialog = useCallback(() => {
      setGoalDialogOpen(true);
    }, []);

    const handleCloseGoalDialog = useCallback(() => {
      setGoalDialogOpen(false);
    }, []);

    const handleSaveGoal = useCallback(
      (goal: number) => {
        onUpdateMonthlyGoal(goal);
        setGoalDialogOpen(false);
      },
      [onUpdateMonthlyGoal]
    );

    const handleClearGoal = useCallback(() => {
      onUpdateMonthlyGoal(0);
      setGoalDialogOpen(false);
    }, [onUpdateMonthlyGoal]);

    const handleOpenCustomRangeDialog = useCallback(() => {
      setCustomRangeDialogOpen(true);
    }, []);

    const handleCloseCustomRangeDialog = useCallback(() => {
      setCustomRangeDialogOpen(false);
    }, []);

    const handleApplyCustomRange = useCallback(
      (start: string, end: string) => {
        onUpdateCustomRange(start, end);
        onSelectTimeframe('CUSTOM');
        setCustomRangeDialogOpen(false);
      },
      [onUpdateCustomRange, onSelectTimeframe]
    );

    const goalProgress =
      monthlyGoal > 0 ? Math.min(Math.max((netPnl / monthlyGoal) * 100, 0), 100) : 0;

    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.background.paper,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: '14px 18px',
            gap: 16,
          }}
        >
          {/* ── Left: PnL stats ─────────────────────────────────────── */}
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'text.disabled',
                  fontSize: '0.68rem',
                  lineHeight: 1,
                }}
              >
                {t('banner.totalProfit', { defaultValue: 'Загальний прибуток' })}{' '}
                <span style={{ opacity: 0.65 }}>{dateRangeLabel}</span>
              </Typography>

              {selectedInstrument && (
                <Chip
                  size="small"
                  label={`${t('table.instrument')}: ${selectedInstrument}`}
                  onDelete={onClearInstrument}
                  color="primary"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600, borderRadius: '4px' }}
                />
              )}
            </div>

            {/* PnL + ROI + trades */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.75rem',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
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
                sx={{
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.92rem',
                  color: (theme) =>
                    roiPercent > 0
                      ? theme.palette.trade.gain
                      : roiPercent < 0
                        ? theme.palette.trade.loss
                        : theme.palette.text.secondary,
                }}
              >
                {roiPercent >= 0 ? `+${roiText}` : roiText}
              </Typography>

              <Typography
                sx={{
                  fontSize: '0.78rem',
                  color: 'text.disabled',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {tradeCount}&thinsp;{t('banner.tradesCount', { defaultValue: 'угод' })}
              </Typography>
            </div>

            {/* Goal tracker */}
            <div style={{ marginTop: 2 }}>
              {monthlyGoal > 0 ? (
                <div
                  onClick={handleOpenGoalDialog}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <FlagIcon sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}
                  >
                    {t('banner.goal')}:{' '}
                    {formatCurrency(monthlyGoal, currency, numberFormat, currentLang)}
                  </Typography>
                  <Box sx={{ width: 64 }}>
                    <LinearProgress
                      variant="determinate"
                      value={goalProgress}
                      color={pnlData.isPositive ? 'success' : 'inherit'}
                      sx={{ height: 3, borderRadius: 2 }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.68rem' }}
                  >
                    {goalProgress.toFixed(0)}%
                  </Typography>
                </div>
              ) : (
                <button
                  onClick={handleOpenGoalDialog}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <FlagIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 500 }}>
                    {t('banner.setMonthGoal', { defaultValue: 'Задати ціль місяця' })}
                  </Typography>
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Controls ──────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* Segmented timeframe control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Pill tab strip */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '3px',
                  gap: '2px',
                }}
              >
                {TIMEFRAME_BUTTONS.map((btn) => {
                  const isActive = timeframe === btn.id;
                  return (
                    <Box
                      key={btn.id}
                      component="button"
                      onClick={() => onSelectTimeframe(btn.id)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '5px',
                        minWidth: 34,
                        height: 26,
                        px: '7px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        fontFamily: 'inherit',
                        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                        backgroundColor: isActive ? 'background.paper' : 'transparent',
                        color: isActive ? 'text.primary' : 'text.disabled',
                        boxShadow: isActive
                          ? (theme) =>
                              theme.palette.mode === 'light'
                                ? '0 1px 3px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)'
                                : '0 1px 3px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06)'
                          : 'none',
                        '&:hover': {
                          color: isActive ? 'text.primary' : 'text.secondary',
                          backgroundColor: isActive
                            ? 'background.paper'
                            : (theme) =>
                                theme.palette.mode === 'light'
                                  ? 'rgba(0,0,0,0.04)'
                                  : 'rgba(255,255,255,0.06)',
                        },
                      }}
                    >
                      {btn.label}
                    </Box>
                  );
                })}
              </Box>

              {/* Calendar / custom range button */}
              <Tooltip title={t('banner.customRange', { defaultValue: 'Свій діапазон' })}>
                <Box
                  component="button"
                  onClick={handleOpenCustomRangeDialog}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    width: 32,
                    height: 32,
                    transition: 'background 0.15s, color 0.15s',
                    backgroundColor: (theme) =>
                      timeframe === 'CUSTOM'
                        ? `${theme.palette.primary.main}18`
                        : theme.palette.mode === 'light'
                          ? 'rgba(0,0,0,0.05)'
                          : 'rgba(255,255,255,0.05)',
                    color: timeframe === 'CUSTOM' ? 'primary.main' : 'text.disabled',
                    '&:hover': {
                      backgroundColor: (theme) =>
                        timeframe === 'CUSTOM'
                          ? `${theme.palette.primary.main}28`
                          : theme.palette.mode === 'light'
                            ? 'rgba(0,0,0,0.09)'
                            : 'rgba(255,255,255,0.09)',
                      color: timeframe === 'CUSTOM' ? 'primary.main' : 'text.secondary',
                    },
                  }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 15 }} />
                </Box>
              </Tooltip>
            </div>

            {/* Deposit editor — compact ghost input */}
            <DepositEditor
              initialDeposit={initialDeposit}
              currency={currency}
              onSave={onUpdateDeposit}
              sx={{
                '& .MuiInputBase-root': {
                  height: 30,
                  fontSize: '0.78rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                  borderRadius: '7px',
                  transition: 'background 0.15s',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(0,0,0,0.06)'
                        : 'rgba(255,255,255,0.07)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(0,0,0,0.03)'
                        : 'rgba(255,255,255,0.05)',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                },
                '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => theme.palette.text.disabled,
                },
                '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '1px',
                  borderColor: (theme) => theme.palette.primary.main,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.72rem',
                  color: 'text.disabled',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                },
                '& .MuiInputAdornment-root p': {
                  fontSize: '0.72rem',
                  color: 'text.disabled',
                  fontWeight: 600,
                },
              }}
            />
          </div>
        </div>

        {/* ── Goal Dialog ────────────────────────────────────────────── */}
        <GoalDialog
          open={goalDialogOpen}
          onClose={handleCloseGoalDialog}
          onSave={handleSaveGoal}
          onClear={handleClearGoal}
          currentGoal={monthlyGoal}
          currency={currency}
          numberFormat={numberFormat}
          initialDeposit={initialDeposit}
        />

        {/* ── Lazy Custom Range Dialog ───────────────────────────────── */}
        {customRangeDialogOpen && (
          <React.Suspense fallback={null}>
            <CustomRangePickerDialog
              open={customRangeDialogOpen}
              onClose={handleCloseCustomRangeDialog}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onApply={handleApplyCustomRange}
            />
          </React.Suspense>
        )}
      </Paper>
    );
  }
);

TimeframeHeaderBanner.displayName = 'TimeframeHeaderBanner';
