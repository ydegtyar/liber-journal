import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useTranslation } from 'react-i18next';
import { NumberFormatOption, JournalSettings } from '../../types/preferences';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: JournalSettings;
  onUpdateSettings: (newSettings: Partial<JournalSettings>) => void;
  numberFormat: NumberFormatOption;
  onUpdateNumberFormat: (format: NumberFormatOption) => void;
  onClearAllData: () => Promise<void>;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onUpdateSettings,
  numberFormat,
  onUpdateNumberFormat,
  onClearAllData,
}) => {
  const { t } = useTranslation();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = async () => {
    await onClearAllData();
    setConfirmClear(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
        {t('settingsModal.title')}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, my: 1 }}>
          {/* Base Currency */}
          <FormControl fullWidth size="small">
            <InputLabel id="currency-select-label">{t('settingsModal.baseCurrency')}</InputLabel>
            <Select
              labelId="currency-select-label"
              value={settings.currency || 'USD'}
              label={t('settingsModal.baseCurrency')}
              onChange={(e) => onUpdateSettings({ currency: e.target.value })}
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="PLN">PLN (zł)</MenuItem>
              <MenuItem value="UAH">UAH (₴)</MenuItem>
            </Select>
          </FormControl>

          {/* Number Formatting Override */}
          <FormControl fullWidth size="small">
            <InputLabel id="number-format-label">{t('settingsModal.numberFormat')}</InputLabel>
            <Select
              labelId="number-format-label"
              value={numberFormat}
              label={t('settingsModal.numberFormat')}
              onChange={(e) => onUpdateNumberFormat(e.target.value as NumberFormatOption)}
            >
              <MenuItem value="locale">{t('settingsModal.formatLocale')}</MenuItem>
              <MenuItem value="dot">{t('settingsModal.formatDot')}</MenuItem>
              <MenuItem value="comma">{t('settingsModal.formatComma')}</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 1 }} />

          {/* Danger Zone */}
          <div>
            <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t('settingsModal.dangerZone')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
              {t('settingsModal.resetDescription')}
            </Typography>

            {!confirmClear ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteForeverIcon />}
                onClick={() => setConfirmClear(true)}
              >
                {t('common.clearAllData')}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant="contained" color="error" size="small" onClick={handleClear}>
                  {t('common.delete')}
                </Button>
                <Button size="small" onClick={() => setConfirmClear(false)}>
                  {t('common.cancel')}
                </Button>
              </Box>
            )}
          </div>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" size="small">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
