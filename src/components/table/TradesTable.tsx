import React, { useMemo, useState, useCallback } from 'react';
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

import { SortColumn, sortTrades, filterTradesByInstrument } from './tradesTableUtils';

interface Props {
  trades: Trade[];
  settings: JournalSettings;
  numberFormat: NumberFormatOption;
  searchQuery?: string;
  sortBy?: SortColumn;
  sortOrder?: SortOrder;
  onSortChange?: (column: SortColumn, order: SortOrder) => void;
  onToggleSort?: () => void;
}

const TradesTableComponent: React.FC<Props> = ({
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
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>(
    settings.sortOrder || 'desc'
  );

  const activeSortBy = sortByProp ?? internalSortBy;
  const activeSortOrder =
    sortOrderProp ?? (activeSortBy === 'date' ? settings.sortOrder : internalSortOrder);

  const handleRequestSort = useCallback(
    (column: SortColumn) => {
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
    },
    [onSortChange, onToggleSort]
  );

  // 1. Filter trades by instrument search query
  const filteredTrades = useMemo(() => {
    return filterTradesByInstrument(trades, searchQuery);
  }, [trades, searchQuery]);

  // 2. Sort trades by selected column & order
  const sortedTrades = useMemo(() => {
    return sortTrades(filteredTrades, activeSortBy, activeSortOrder);
  }, [filteredTrades]);

  const totalTrades = sortedTrades.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalTrades / pageSize));
  const currentPage = Math.min(page, totalPages);

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
          : sortedTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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
  }, [sortedTrades, settings.groupBy, currentPage, pageSize]);

  const columnCount = 9;
  const startCount = pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1;
  const endCount = pageSize === 'all' ? totalTrades : Math.min(currentPage * pageSize, totalTrades);

  const handlePageSizeChange = useCallback((e: any) => {
    setPageSize(e.target.value as number | 'all');
    setPage(1);
  }, []);

  const handlePagePrev = useCallback(() => {
    setPage((p) => Math.max(Math.min(p, totalPages) - 1, 1));
  }, [totalPages]);

  const handlePageNext = useCallback(() => {
    setPage((p) => Math.min(Math.min(p, totalPages) + 1, totalPages));
  }, [totalPages]);

  return (
    <div>
      <TableContainer component={Paper} sx={{ maxHeight: 680, overflowY: 'auto' }}>
        <Table stickyHeader size="small" aria-label="Trades ledger table">
          <TableHead>
            <TableRow>
              {/* 1. Date */}
              <TableCell sortDirection={activeSortBy === 'date' ? activeSortOrder : false}>
                <Tooltip
                  title={
                    activeSortBy === 'date' && activeSortOrder === 'asc'
                      ? t('table.sortOldestFirst')
                      : t('table.sortNewestFirst')
                  }
                >
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
                <TableCell
                  colSpan={columnCount}
                  sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
                >
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
              {t('table.showing', { defaultValue: 'Показано' })} {startCount}-{endCount}{' '}
              {t('table.of', { defaultValue: 'з' })} {totalTrades}{' '}
              {t('banner.tradesCount', { defaultValue: 'угод' })}
            </Typography>

            <FormControl size="small" sx={{ ml: 1 }}>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
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
                disabled={currentPage <= 1}
                onClick={handlePagePrev}
                startIcon={<NavigateBeforeIcon />}
                sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
              >
                {t('table.prev', { defaultValue: 'Назад' })}
              </Button>

              <Typography variant="caption" sx={{ fontWeight: 600, px: 0.5 }}>
                {t('table.pageOf', { defaultValue: 'Сторінка' })} {currentPage}{' '}
                {t('table.of', { defaultValue: 'з' })} {totalPages}
              </Typography>

              <Button
                size="small"
                variant="outlined"
                disabled={currentPage >= totalPages}
                onClick={handlePageNext}
                endIcon={<NavigateNextIcon />}
                sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
              >
                {t('table.next', { defaultValue: 'Вперед' })}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
};

export const TradesTable = React.memo(TradesTableComponent);
