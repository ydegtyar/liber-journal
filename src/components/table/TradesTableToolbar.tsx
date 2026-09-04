import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';
import { JournalSettings } from '../../types/preferences';
import { GroupByOption } from '../../types/trade';
import { DepositEditor } from '../deposit/DepositEditor';
import { CsvUploadDropzone } from '../upload/CsvUploadDropzone';

interface TradesTableToolbarProps {
  settings: JournalSettings;
  tradeCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isExporting: boolean;
  isImporting: boolean;
  onUpdateDeposit: (amount: number) => void;
  onSetGroupBy: (groupBy: GroupByOption) => void;
  onToggleSort: () => void;
  onExportXlsx: () => void;
  onUploadFile: (file: File) => Promise<unknown>;
  onOpenSettings: () => void;
}

export const TradesTableToolbar: React.FC<TradesTableToolbarProps> = ({
  settings,
  tradeCount,
  searchQuery = '',
  onSearchChange,
  isExporting,
  isImporting,
  onUpdateDeposit,
  onSetGroupBy,
  onToggleSort,
  onExportXlsx,
  onUploadFile,
  onOpenSettings,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      {/* Left controls: Deposit input & Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Trade Ledger ({tradeCount})
        </Typography>

        <DepositEditor
          initialDeposit={settings.initialDeposit}
          currency={settings.currency}
          onSave={onUpdateDeposit}
        />
      </Box>

      {/* Right controls: Search, Group by, Sort, Upload, Export, Settings */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
        {/* Search input for instruments */}
        {onSearchChange && (
          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('table.searchInstruments', { defaultValue: 'Search instruments...' })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    edge="end"
                    sx={{ p: 0.25 }}
                    aria-label="clear search"
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { height: 32, fontSize: '0.8rem', minWidth: 160, maxWidth: 220 },
            }}
          />
        )}

        {/* Group By selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={settings.groupBy}
            onChange={(e) => onSetGroupBy(e.target.value as GroupByOption)}
            displayEmpty
            sx={{ height: 32, fontSize: '0.8rem' }}
          >
            <MenuItem value="none">{t('table.groupBy')}: {t('table.groupNone')}</MenuItem>
            <MenuItem value="day">{t('table.groupBy')}: {t('table.groupDay')}</MenuItem>
            <MenuItem value="week">{t('table.groupBy')}: {t('table.groupWeek')}</MenuItem>
            <MenuItem value="month">{t('table.groupBy')}: {t('table.groupMonth')}</MenuItem>
          </Select>
        </FormControl>

        {/* Sort order toggle button */}
        <Tooltip title={settings.sortOrder === 'asc' ? t('table.sortOldestFirst') : t('table.sortNewestFirst')}>
          <Button
            size="small"
            variant="outlined"
            onClick={onToggleSort}
            startIcon={settings.sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            sx={{ height: 32, px: 1.2, fontSize: '0.75rem' }}
          >
            {settings.sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </Button>
        </Tooltip>

        {/* Compact Upload CSV button */}
        <CsvUploadDropzone onFileSelected={onUploadFile} isImporting={isImporting} compact />

        {/* Export XLSX button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          onClick={onExportXlsx}
          disabled={tradeCount === 0 || isExporting}
          sx={{ height: 32, fontSize: '0.75rem' }}
        >
          {t('common.exportXlsx')}
        </Button>

        {/* Settings button */}
        <Tooltip title={t('common.settings')}>
          <IconButton size="small" onClick={onOpenSettings} sx={{ p: 0.6 }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
