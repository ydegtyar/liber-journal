import React, { useMemo } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { JournalSettings, NumberFormatOption } from '../../types/preferences';
import { calculateGroupSummaries, getGroupKey } from '../../lib/calculations';
import { TradeRow } from './TradeRow';
import { GroupHeaderRow } from './GroupHeaderRow';

interface TradesTableProps {
  trades: Trade[];
  settings: JournalSettings;
  numberFormat: NumberFormatOption;
  onUpdateTrade: (trade: Trade) => void;
  onDuplicateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

export const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  settings,
  numberFormat,
  onUpdateTrade,
  onDuplicateTrade,
  onDeleteTrade,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en-US';

  // 1. Sort trades
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const timeA = new Date(a.closedAt).getTime() || 0;
      const timeB = new Date(b.closedAt).getTime() || 0;
      return settings.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [trades, settings.sortOrder]);

  // 2. Compute group summaries if grouping is active
  const groupSummaries = useMemo(() => {
    if (settings.groupBy === 'none') return {};
    return calculateGroupSummaries(sortedTrades, settings.groupBy);
  }, [sortedTrades, settings.groupBy]);

  // 3. Cluster trades by group if grouping active
  const groupedSections = useMemo(() => {
    if (settings.groupBy === 'none') {
      return [{ key: 'all', trades: sortedTrades }];
    }

    const sections: Array<{ key: string; trades: Trade[] }> = [];
    const map: Record<string, Trade[]> = {};

    for (const trade of sortedTrades) {
      const key = getGroupKey(trade.closedAt, settings.groupBy);
      if (!map[key]) {
        map[key] = [];
        sections.push({ key, trades: map[key] });
      }
      map[key].push(trade);
    }

    return sections;
  }, [sortedTrades, settings.groupBy]);

  const columnCount = 14;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 680, overflowY: 'auto' }}>
      <Table stickyHeader size="small" aria-label="Trades ledger table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 90 }}>{t('table.actions')}</TableCell>
            <TableCell>{t('table.dealId')}</TableCell>
            <TableCell>{t('table.instrument')}</TableCell>
            <TableCell>{t('table.direction')}</TableCell>
            <TableCell>{t('table.openedAt')}</TableCell>
            <TableCell>{t('table.closedAt')}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{t('table.openPrice')}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{t('table.closePrice')}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{t('table.margin')}</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>{t('table.leverage')}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{t('table.grossReturn')}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{t('table.pnl')}</TableCell>
            <TableCell>{t('table.tag')}</TableCell>
            <TableCell>{t('table.notes')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedSections.map((section) => (
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
                  onUpdate={onUpdateTrade}
                  onDuplicate={onDuplicateTrade}
                  onDelete={onDeleteTrade}
                />
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
