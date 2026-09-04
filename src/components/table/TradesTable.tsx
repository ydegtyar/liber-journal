import React, { useMemo, useState, useEffect } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableSortLabel,
  Tooltip,
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useTranslation } from 'react-i18next';
import { Trade, SortOrder } from '../../types/trade';
import { JournalSettings, NumberFormatOption } from '../../types/preferences';
import { calculateGroupSummaries, getGroupKey } from '../../lib/calculations';
import { TradeRow } from './TradeRow';
import { GroupHeaderRow } from './GroupHeaderRow';

export type SortColumn = 'date' | 'duration' | 'grossReturn' | 'pnl';

export function getTradeDurationMs(openedAt?: string, closedAt?: string): number {
  if (!openedAt || !closedAt) return 0;
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return end - start;
}

export function sortTrades(
  trades: Trade[],
  sortBy: SortColumn,
  sortOrder: SortOrder
): Trade[] {
  return [...trades].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      comparison = timeA - timeB;
    } else if (sortBy === 'duration') {
      const durA = getTradeDurationMs(a.openedAt, a.closedAt);
      const durB = getTradeDurationMs(b.openedAt, b.closedAt);
      comparison = durA - durB;
    } else if (sortBy === 'grossReturn') {
      comparison = (a.grossReturn ?? 0) - (b.grossReturn ?? 0);
    } else if (sortBy === 'pnl') {
      comparison = (a.pnl ?? 0) - (b.pnl ?? 0);
    }

    if (comparison === 0) {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      comparison = timeA - timeB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export function filterTradesByInstrument(trades: Trade[], query?: string): Trade[] {
  if (!query || !query.trim()) return trades;
  const q = query.trim().toLowerCase();
  return trades.filter((trade) => trade.instrument.toLowerCase().includes(q));
}

interface TradesTableProps {
  trades: Trade[];
  settings: JournalSettings;
  numberFormat: NumberFormatOption;
  searchQuery?: string;
  sortBy?: SortColumn;
  sortOrder?: SortOrder;
  onSortChange?: (column: SortColumn, order: SortOrder) => void;
  onToggleSort?: () => void;
}

export const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  settings,
  numberFormat,
  searchQuery,
  sortBy: sortByProp,
  sortOrder: sortOrderProp,
  onSortChange,
  onToggleSort,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en-US';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);

  const [internalSortBy, setInternalSortBy] = useState<SortColumn>('date');
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>(settings.sortOrder || 'desc');

  const activeSortBy = sortByProp ?? internalSortBy;
  const activeSortOrder = sortOrderProp ?? (activeSortBy === 'date' ? settings.sortOrder : internalSortOrder);

  // Sync internal sort order if settings.sortOrder changes and sortBy is date
  useEffect(() => {
    if (activeSortBy === 'date') {
      setInternalSortOrder(settings.sortOrder);
    }
  }, [settings.sortOrder, activeSortBy]);

  const handleRequestSort = (column: SortColumn) => {
    let nextOrder: SortOrder = 'desc';
    if (activeSortBy === column) {
      nextOrder = activeSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      nextOrder = 'desc';
    }

    setInternalSortBy(column);
    setInternalSortOrder(nextOrder);

    if (onSortChange) {
      onSortChange(column, nextOrder);
    }

    if (column === 'date' && onToggleSort) {
      onToggleSort();
    }
  };

  // 1. Filter trades by instrument search query
  const filteredTrades = useMemo(() => {
    return filterTradesByInstrument(trades, searchQuery);
  }, [trades, searchQuery]);

  // 2. Sort trades by selected column & order
  const sortedTrades = useMemo(() => {
    return sortTrades(filteredTrades, activeSortBy, activeSortOrder);
  }, [filteredTrades, activeSortBy, activeSortOrder]);

  // Reset to page 1 if total trades changes
  useEffect(() => {
    setPage(1);
  }, [sortedTrades.length, pageSize]);

  // 3. Compute group summaries if grouping is active
  const groupSummaries = useMemo(() => {
    if (settings.groupBy === 'none') return {};
    return calculateGroupSummaries(sortedTrades, settings.groupBy);
  }, [sortedTrades, settings.groupBy]);

  // 4. Cluster trades by group if grouping active
  const groupedSections = useMemo(() => {
    if (settings.groupBy === 'none') {
      const displayList =
        pageSize === 'all'
          ? sortedTrades
          : sortedTrades.slice((page - 1) * pageSize, page * pageSize);
      return [{ key: 'all', trades: displayList }];
    }

    const sections: Array<{ key: string; trades: Trade[] }> = [];
    const map: Record<string, Trade[]> = {};

    for (const trade of sortedTrades) {
      const key = getGroupKey(trade.closedAt || trade.openedAt, settings.groupBy);
      if (!map[key]) {
        map[key] = [];
        sections.push({ key, trades: map[key] });
      }
      map[key].push(trade);
    }

    return sections;
  }, [sortedTrades, settings.groupBy, page, pageSize]);

  const columnCount = 9;
  const totalTrades = sortedTrades.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalTrades / pageSize));
  const startCount = pageSize === 'all' ? 1 : (page - 1) * pageSize + 1;
  const endCount = pageSize === 'all' ? totalTrades : Math.min(page * pageSize, totalTrades);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 680, overflowY: 'auto' }}>
        <Table stickyHeader size="small" aria-label="Trades ledger table">
          <TableHead>
            <TableRow>
              {/* 1. Date */}
              <TableCell sortDirection={activeSortBy === 'date' ? activeSortOrder : false}>
                <Tooltip title={activeSortBy === 'date' && activeSortOrder === 'asc' ? t('table.sortOldestFirst') : t('table.sortNewestFirst')}>
                  <TableSortLabel
                    active={activeSortBy === 'date'}
                    direction={activeSortBy === 'date' ? activeSortOrder : 'desc'}
                    onClick={() => handleRequestSort('date')}
                  >
                    {t('table.date')}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>

              {/* 2. Instrument */}
              <TableCell>{t('table.instrument')}</TableCell>

              {/* 3. Duration */}
              <TableCell sortDirection={activeSortBy === 'duration' ? activeSortOrder : false}>
                <TableSortLabel
                  active={activeSortBy === 'duration'}
                  direction={activeSortBy === 'duration' ? activeSortOrder : 'desc'}
                  onClick={() => handleRequestSort('duration')}
                >
                  {t('table.duration')}
                </TableSortLabel>
              </TableCell>

              {/* 4. Open Price */}
              <TableCell sx={{ textAlign: 'right' }}>{t('table.openPrice')}</TableCell>

              {/* 5. Close Price */}
              <TableCell sx={{ textAlign: 'right' }}>{t('table.closePrice')}</TableCell>

              {/* 6. Margin */}
              <TableCell sx={{ textAlign: 'right' }}>{t('table.margin')}</TableCell>

              {/* 7. Leverage */}
              <TableCell sx={{ textAlign: 'center' }}>{t('table.leverage')}</TableCell>

              {/* 8. Gross Return */}
              <TableCell
                align="right"
                sortDirection={activeSortBy === 'grossReturn' ? activeSortOrder : false}
              >
                <TableSortLabel
                  active={activeSortBy === 'grossReturn'}
                  direction={activeSortBy === 'grossReturn' ? activeSortOrder : 'desc'}
                  onClick={() => handleRequestSort('grossReturn')}
                >
                  {t('table.grossReturn')}
                </TableSortLabel>
              </TableCell>

              {/* 9. Net P&L */}
              <TableCell
                align="right"
                sortDirection={activeSortBy === 'pnl' ? activeSortOrder : false}
              >
                <TableSortLabel
                  active={activeSortBy === 'pnl'}
                  direction={activeSortBy === 'pnl' ? activeSortOrder : 'desc'}
                  onClick={() => handleRequestSort('pnl')}
                >
                  {t('table.pnl')}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  {t('table.noTradesFound', { defaultValue: 'No trades found' })}
                </TableCell>
              </TableRow>
            ) : (
              groupedSections.map((section) => (
                <React.Fragment key={section.key}>
                  {/* If grouped, show GroupHeaderRow ABOVE child trades */}
                  {settings.groupBy !== 'none' && groupSummaries[section.key] && (
                    <GroupHeaderRow
                      summary={groupSummaries[section.key]}
                      colSpan={columnCount}
                      currency={settings.currency}
                      numberFormat={numberFormat}
                      locale={currentLang}
                    />
                  )}

                  {/* Child trades */}
                  {section.trades.map((trade) => (
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                      currency={settings.currency}
                      numberFormat={numberFormat}
                      locale={currentLang}
                    />
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer Bar matching competitor screenshot 5 */}
      {settings.groupBy === 'none' && totalTrades > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper,
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {t('table.showing', { defaultValue: 'Показано' })} {startCount}-{endCount} {t('table.of', { defaultValue: 'з' })} {totalTrades} {t('banner.tradesCount', { defaultValue: 'угод' })}
            </Typography>

            <FormControl size="small" sx={{ ml: 1 }}>
              <Select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as number | 'all')}
                sx={{ height: 28, fontSize: '0.75rem' }}
              >
                <MenuItem value={10}>10 / {t('table.page', { defaultValue: 'стор.' })}</MenuItem>
                <MenuItem value={25}>25 / {t('table.page', { defaultValue: 'стор.' })}</MenuItem>
                <MenuItem value={50}>50 / {t('table.page', { defaultValue: 'стор.' })}</MenuItem>
                <MenuItem value="all">{t('common.all', { defaultValue: 'Всі' })}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {pageSize !== 'all' && totalPages > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                startIcon={<NavigateBeforeIcon />}
                sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
              >
                {t('table.prev', { defaultValue: 'Назад' })}
              </Button>

              <Typography variant="caption" sx={{ fontWeight: 600, px: 0.5 }}>
                {t('table.pageOf', { defaultValue: 'Сторінка' })} {page} {t('table.of', { defaultValue: 'з' })} {totalPages}
              </Typography>

              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                endIcon={<NavigateNextIcon />}
                sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
              >
                {t('table.next', { defaultValue: 'Вперед' })}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
