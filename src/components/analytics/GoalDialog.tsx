import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: number) => void;
  onClear: () => void;
  currentGoal: number;
  currency: string;
  numberFormat: NumberFormatOption;
  initialDeposit: number;
}

const PRESET_PERCENTS = [3, 5, 10, 15] as const;

export const GoalDialog: React.FC<GoalDialogProps> = React.memo(
  ({ open, onClose, onSave, onClear, currentGoal, currency, numberFormat, initialDeposit }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en-US';

    const [goalInput, setGoalInput] = useState(currentGoal > 0 ? String(currentGoal) : '');

    // Sync input value whenever dialog opens or currentGoal changes
    useEffect(() => {
      if (open) {
        setGoalInput(currentGoal > 0 ? String(currentGoal) : '');
      }
    }, [open, currentGoal]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setGoalInput(e.target.value);
    }, []);

    const handlePreset = useCallback(
      (percent: number) => {
        const amount = Math.round((initialDeposit * percent) / 100);
        setGoalInput(String(amount));
      },
      [initialDeposit]
    );

    const handleSave = useCallback(() => {
      const val = parseFloat(goalInput);
      onSave(isNaN(val) || val < 0 ? 0 : val);
    }, [goalInput, onSave]);

    const showPresets = initialDeposit > 0;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
          {t('banner.setMonthGoal', { defaultValue: 'Задати ціль місяця' })}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('banner.goalDescription', {
              defaultValue: 'Вкажіть цільовий прибуток для відстеження прогресу за місяць.',
            })}
          </Typography>

          {showPresets && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {PRESET_PERCENTS.map((pct) => {
                const amount = Math.round((initialDeposit * pct) / 100);
                const label = formatCurrency(amount, currency, numberFormat, currentLang);
                return (
                  <Button
                    key={pct}
                    size="small"
                    variant="outlined"
                    onClick={() => handlePreset(pct)}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      px: 1,
                      py: 0.25,
                      minWidth: 0,
                      lineHeight: 1.5,
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'light'
                            ? `${theme.palette.primary.main}0f`
                            : `${theme.palette.primary.main}1a`,
                      },
                    }}
                  >
                    {pct}%&thinsp;
                    <span style={{ opacity: 0.65, fontWeight: 500 }}>{label}</span>
                  </Button>
                );
              })}
            </div>
          )}

          <TextField
            autoFocus
            type="number"
            label={`${t('banner.targetProfit', { defaultValue: 'Цільовий прибуток' })} (${currency})`}
            fullWidth
            value={goalInput}
            onChange={handleInputChange}
            slotProps={{
              htmlInput: { min: 0, step: 50 },
            }}
          />
        </DialogContent>

        <DialogActions>
          {currentGoal > 0 && (
            <Button color="error" onClick={onClear}>
              {t('common.clear', { defaultValue: 'Очистити' })}
            </Button>
          )}
          <Button onClick={onClose}>{t('common.cancel', { defaultValue: 'Скасувати' })}</Button>
          <Button variant="contained" onClick={handleSave}>
            {t('common.save', { defaultValue: 'Зберегти' })}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

GoalDialog.displayName = 'GoalDialog';
