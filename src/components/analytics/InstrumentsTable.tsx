import React, { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StarIcon from '@mui/icons-material/Star';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useTranslation } from 'react-i18next';
import { InstrumentSummary, Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import {
  calculateInstrumentScores,
  InstrumentScoreConfig,
  InstrumentScoreRow,
  DEFAULT_SCORE_CONFIG,
} from '../../utils/instrumentScore';
import { InstrumentRow } from './InstrumentRow';

export interface Props {
  data: InstrumentSummary[];
  trades?: Trade[];
  currency: string;
  numberFormat: NumberFormatOption;
  selectedInstrument: string | null;
  onSelectInstrument: (symbol: string) => void;
  scoreConfig?: Partial<InstrumentScoreConfig>;
}

type SortField =
  'symbol' | 'trades' | 'winRate' | 'netPnl' | 'score' | 'avgPnl' | 'avgDuration' | 'sharePercent';

type QuickFilter = 'all' | 'best' | 'worst' | 'lowSample';

export const InstrumentsTable: React.FC<Props> = React.memo(
  ({
    data,
    trades,
    currency,
    numberFormat,
    selectedInstrument,
    onSelectInstrument,
    scoreConfig,
  }) => {
    const { t } = useTranslation();

    const [sortField, setSortField] = useState<SortField>('netPnl');
    const [sortAsc, setSortAsc] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

    const handleSort = useCallback((field: SortField) => {
      setSortField((prevField) => {
        if (prevField === field) {
          setSortAsc((prevAsc) => !prevAsc);
          return prevField;
        } else {
          setSortAsc(false);
          return field;
        }
      });
    }, []);

    // Pure score calculation memoized on data, trades, and config
    // Pure pure utility calculateInstrumentScores
    const scoredData: InstrumentScoreRow[] = useMemo(() => {
      if (!data || data.length === 0) return [];

      // Group trades by instrument symbol if trades array is provided
      let tradesBySymbol: Record<string, Trade[]> | undefined = undefined;
      if (trades && trades.length > 0) {
        tradesBySymbol = {};
        for (const tr of trades) {
          const sym = tr.instrument || 'Unknown';
          if (!tradesBySymbol[sym]) {
            tradesBySymbol[sym] = [];
          }
          tradesBySymbol[sym].push(tr);
        }
      }

      const rowsWithTrades = data.map((item) => ({
        ...item,
        tradesData: tradesBySymbol ? tradesBySymbol[item.symbol] || [] : undefined,
      }));

      return calculateInstrumentScores(rowsWithTrades, scoreConfig);
    }, [data, trades, scoreConfig]);

    // Compute best and worst from scoredData among eligible instruments
    const { bestInstrument, worstInstrument } = useMemo(() => {
      const eligible = scoredData.filter((r) => r.rating !== 'insufficient' && r.score !== null);
      if (eligible.length === 0) {
        return { bestInstrument: null, worstInstrument: null };
      }

      // Sort by score desc, then trades desc, then symbol asc
      const sorted = [...eligible].sort((a, b) => {
        const scA = a.score ?? 0;
        const scB = b.score ?? 0;
        if (Math.abs(scB - scA) > 1e-6) return scB - scA;
        if (b.trades !== a.trades) return b.trades - a.trades;
        return a.symbol.localeCompare(b.symbol);
      });

      return {
        bestInstrument: sorted[0],
        worstInstrument: sorted[sorted.length - 1],
      };
    }, [scoredData]);

    // Filter data by search query and quick filter
    const filteredData = useMemo(() => {
      let result = scoredData;

      // Quick filter
      if (quickFilter === 'best') {
        result = result.filter((item) => item.rating === 'best');
      } else if (quickFilter === 'worst') {
        result = result.filter((item) => item.rating === 'worst');
      } else if (quickFilter === 'lowSample') {
        result = result.filter((item) => item.rating === 'insufficient');
      }

      // Search query
      if (filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        result = result.filter((item) => item.symbol.toLowerCase().includes(q));
      }

      return result;
    }, [scoredData, filterQuery, quickFilter]);

    // Sort data
    const sortedData = useMemo(() => {
      return [...filteredData].sort((a, b) => {
        let diff = 0;
        if (sortField === 'symbol') diff = a.symbol.localeCompare(b.symbol);
        else if (sortField === 'trades') diff = a.trades - b.trades;
        else if (sortField === 'winRate') diff = a.winRate - b.winRate;
        else if (sortField === 'netPnl') diff = a.netPnl - b.netPnl;
        else if (sortField === 'score') {
          const valA = a.score !== null ? a.score : -1;
          const valB = b.score !== null ? b.score : -1;
          diff = valA - valB;
        } else if (sortField === 'avgPnl') diff = a.avgPnl - b.avgPnl;
        else if (sortField === 'avgDuration') diff = a.avgDurationMs - b.avgDurationMs;
        else if (sortField === 'sharePercent') diff = a.sharePercent - b.sharePercent;
        return sortAsc ? diff : -diff;
      });
    }, [filteredData, sortField, sortAsc]);

    if (data.length === 0) return null;

    const minTrades = scoreConfig?.minTrades ?? DEFAULT_SCORE_CONFIG.minTrades;

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
        {/* Top Header Strip */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <div>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
              {t('instruments.title', { defaultValue: 'Інструменти' })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('instruments.subtitle', {
                defaultValue: 'Клік по ряду — фільтр за інструментом · «Деталі» — список угод',
              })}
            </Typography>
          </div>

          {/* Best / Worst Summary Strip */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'action.hover',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {/* Best Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {bestInstrument
                  ? t('instruments.summaryBest', {
                      defaultValue: `Best: ${bestInstrument.symbol} (${bestInstrument.score})`,
                      symbol: bestInstrument.symbol,
                      score: bestInstrument.score,
                    })
                  : t('instruments.summaryNoBest', { defaultValue: 'Best: —' })}
              </Typography>
            </div>

            {/* Worst Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ThumbDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {worstInstrument
                  ? t('instruments.summaryWorst', {
                      defaultValue: `Worst: ${worstInstrument.symbol} (${worstInstrument.score})`,
                      symbol: worstInstrument.symbol,
                      score: worstInstrument.score,
                    })
                  : t('instruments.summaryNoWorst', { defaultValue: 'Worst: —' })}
              </Typography>
            </div>

            {/* Methodology Info Tooltip */}
            <Tooltip
              arrow
              title={
                <Box sx={{ p: 0.5, maxWidth: 300 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    {t('instruments.methodologyTitle', {
                      defaultValue: 'Instrument Scoring Methodology',
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {t('instruments.methodologyDesc', {
                      defaultValue:
                        'Composite 0-100 score ranking instruments by edge quality, expectancy, profit factor, Sortino, drawdowns, recovery, payoff ratio, and consistency. Requires at least {{minTrades}} trades for scoring with Bayesian confidence shrinkage to avoid small-sample bias.',
                      minTrades,
                    })}
                  </Typography>
                </Box>
              }
            >
              <IconButton
                size="small"
                aria-label={t('instruments.methodologyTitle', {
                  defaultValue: 'Instrument Scoring Methodology',
                })}
                sx={{ p: 0.25, color: 'text.secondary' }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Quick Filter Toggle Group & Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              size="small"
              value={quickFilter}
              exclusive
              onChange={(_, val) => {
                if (val !== null) setQuickFilter(val);
              }}
              aria-label="Filter instruments by rating"
              sx={{
                height: 32,
                '& .MuiToggleButton-root': {
                  fontSize: '0.72rem',
                  px: 1,
                  py: 0.25,
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              <ToggleButton value="all">
                {t('instruments.filterAll', { defaultValue: 'All' })}
              </ToggleButton>
              <ToggleButton value="best">
                {t('instruments.filterBest', { defaultValue: 'Best' })}
              </ToggleButton>
              <ToggleButton value="worst">
                {t('instruments.filterWorst', { defaultValue: 'Worst' })}
              </ToggleButton>
              <ToggleButton value="lowSample">
                {t('instruments.filterLowSample', { defaultValue: 'Low sample' })}
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              size="small"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t('instruments.filterPlaceholder', {
                defaultValue: 'Фільтр інструментів...',
              })}
              slotProps={{
                htmlInput: {
                  'aria-label': t('instruments.filterLabel', {
                    defaultValue: 'Фільтрувати інструменти',
                  }),
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: filterQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilterQuery('')}
                        edge="end"
                        sx={{ p: 0.25 }}
                        aria-label={t('instruments.clearFilter', {
                          defaultValue: 'Очистити фільтр',
                        })}
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { height: 32, fontSize: '0.8rem', minWidth: 140, maxWidth: 200 },
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table
            size="small"
            aria-label={t('instruments.tableAria', {
              defaultValue: 'Таблиця розподілу за інструментами',
            })}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'symbol'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('symbol')}
                  >
                    {t('instruments.instrument', { defaultValue: 'ІНСТРУМЕНТ' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'trades'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('trades')}
                  >
                    {t('instruments.trades', { defaultValue: 'УГОД' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'winRate'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('winRate')}
                  >
                    {t('instruments.winRate', { defaultValue: 'WIN %' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'netPnl'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('netPnl')}
                  >
                    {t('instruments.netPnl', { defaultValue: 'NET P&L' })}
                  </TableSortLabel>
                </TableCell>

                {/* Score Column */}
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'score'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('score')}
                  >
                    {t('instruments.score', { defaultValue: 'SCORE' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'avgPnl'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('avgPnl')}
                  >
                    {t('instruments.avg', { defaultValue: 'AVG' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'avgDuration'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('avgDuration')}
                  >
                    {t('instruments.avgDuration', { defaultValue: 'СЕР. ТРИВАЛІСТЬ' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'sharePercent'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('sharePercent')}
                  >
                    {t('instruments.share', { defaultValue: 'ЧАСТКА' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="center">
                  {t('instruments.trend', { defaultValue: 'ТРЕНД' })}
                </TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      {t('instruments.noMatchingInstruments', {
                        defaultValue: 'Не знайдено інструментів',
                      })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row) => (
                  <InstrumentRow
                    key={row.symbol}
                    row={row}
                    currency={currency}
                    numberFormat={numberFormat}
                    isSelected={selectedInstrument?.toLowerCase() === row.symbol.toLowerCase()}
                    onSelect={onSelectInstrument}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    );
  }
);

InstrumentsTable.displayName = 'InstrumentsTable';
