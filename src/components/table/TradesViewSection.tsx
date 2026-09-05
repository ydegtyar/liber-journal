import React, { useState, useTransition, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import { useTranslation } from 'react-i18next';
import { Trade, GroupByOption } from '../../types/trade';
import { JournalSettings, NumberFormatOption } from '../../types/preferences';
import { TradesTableToolbar } from './TradesTableToolbar';
import { TradesTable } from './TradesTable';
import { DailyOrdersMatrixTable } from '../matrix/DailyOrdersMatrixTable';

export interface TradesViewSectionProps {
  filteredTrades: Trade[];
  settings: JournalSettings;
  numberFormat: NumberFormatOption;
  isExporting: boolean;
  isImporting: boolean;
  onSetGroupBy: (groupBy: GroupByOption) => void;
  onToggleSort: () => void;
  onExportXlsx: () => void;
  onUploadFile: (file: File) => Promise<unknown>;
  onOpenSettings: () => void;
}

const TradesViewSectionComponent: React.FC<TradesViewSectionProps> = ({
  filteredTrades,
  settings,
  numberFormat,
  isExporting,
  isImporting,
  onSetGroupBy,
  onToggleSort,
  onExportXlsx,
  onUploadFile,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const [tableViewMode, setTableViewMode] = useState<'ledger' | 'matrix'>('ledger');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  const handleTabChange = useCallback((_e: any, val: 'ledger' | 'matrix') => {
    startTransition(() => setTableViewMode(val));
  }, []);

  const searchedTradeCount = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) return filteredTrades.length;
    return filteredTrades.filter((t) => t.instrument.toLowerCase().includes(q)).length;
  }, [filteredTrades, tableSearchQuery]);

  return (
    <Box component="section" aria-label="Continuous Trade Ledger and Daily Orders" sx={{ mb: 2.5 }}>
      <Box
        sx={{
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Tabs
          value={tableViewMode}
          onChange={handleTabChange}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': {
              minHeight: 38,
              py: 0.5,
              px: 1.5,
              fontSize: '0.8rem',
              fontWeight: 700,
            },
          }}
        >
          <Tab
            value="ledger"
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`${t('dailyMatrix.tabLedger')} (${filteredTrades.length})`}
          />
          <Tab
            value="matrix"
            icon={<CalendarViewMonthIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t('dailyMatrix.tabMatrix')}
          />
        </Tabs>
      </Box>

      {tableViewMode === 'ledger' ? (
        <Box
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <TradesTableToolbar
            settings={settings}
            tradeCount={searchedTradeCount}
            searchQuery={tableSearchQuery}
            onSearchChange={setTableSearchQuery}
            isExporting={isExporting}
            isImporting={isImporting}
            onSetGroupBy={onSetGroupBy}
            onToggleSort={onToggleSort}
            onExportXlsx={onExportXlsx}
            onUploadFile={onUploadFile}
            onOpenSettings={onOpenSettings}
          />

          <TradesTable
            trades={filteredTrades}
            settings={settings}
            numberFormat={numberFormat}
            searchQuery={tableSearchQuery}
            onToggleSort={onToggleSort}
          />
        </Box>
      ) : (
        <DailyOrdersMatrixTable
          trades={filteredTrades}
          currency={settings.currency}
          numberFormat={numberFormat}
          onExportXlsx={onExportXlsx}
          isExporting={isExporting}
          columnOrder={settings.matrixColumnOrder}
        />
      )}
    </Box>
  );
};

export const TradesViewSection = React.memo(TradesViewSectionComponent);
