import React, { useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';
import { getDefault3MonthsRange } from '../../lib/dateUtils';

export interface CustomRangePickerDialogProps {
  open: boolean;
  onClose: () => void;
  customStartDate: string;
  customEndDate: string;
  onApply: (start: string, end: string) => void;
}

function showNativePicker(ref: React.RefObject<HTMLInputElement | null>): void {
  const el = ref.current;
  if (!el) return;
  try {
    // showPicker() is supported in Chrome 99+, Firefox 101+, Safari 15.4+
    (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  } catch {
    el.click();
  }
}

export const CustomRangePickerDialog: React.FC<CustomRangePickerDialogProps> = React.memo(
  ({ open, onClose, customStartDate, customEndDate, onApply }) => {
    const { t } = useTranslation();

    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);

    const [startDateInput, setStartDateInput] = useState(
      () => customStartDate || getDefault3MonthsRange().startDate
    );
    const [endDateInput, setEndDateInput] = useState(
      () => customEndDate || getDefault3MonthsRange().endDate
    );

    const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setStartDateInput(e.target.value);
    }, []);

    const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDateInput(e.target.value);
    }, []);

    const handleOpenStartPicker = useCallback(() => {
      showNativePicker(startInputRef);
    }, []);

    const handleOpenEndPicker = useCallback(() => {
      showNativePicker(endInputRef);
    }, []);

    const handleSave = useCallback(() => {
      const def = getDefault3MonthsRange();
      const start = startDateInput || def.startDate;
      const end = endDateInput || def.endDate;
      onApply(start, end);
    }, [startDateInput, endDateInput, onApply]);

    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {t('banner.customRange', { defaultValue: 'Свій діапазон' })}
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Закрити' })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              type="date"
              label={t('banner.startDate', { defaultValue: 'Дата початку' })}
              value={startDateInput}
              onChange={handleStartDateChange}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  inputRef: startInputRef,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleOpenStartPicker}
                        aria-label={t('banner.startDate', { defaultValue: 'Дата початку' })}
                        edge="end"
                      >
                        <CalendarMonthIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
            />
            <TextField
              type="date"
              label={t('banner.endDate', { defaultValue: 'Дата кінця' })}
              value={endDateInput}
              onChange={handleEndDateChange}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  inputRef: endInputRef,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleOpenEndPicker}
                        aria-label={t('banner.endDate', { defaultValue: 'Дата кінця' })}
                        edge="end"
                      >
                        <CalendarMonthIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel', { defaultValue: 'Скасувати' })}</Button>
          <Button variant="contained" onClick={handleSave}>
            {t('common.save', { defaultValue: 'Застосувати' })}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

CustomRangePickerDialog.displayName = 'CustomRangePickerDialog';
