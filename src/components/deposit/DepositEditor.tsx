import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, SxProps, Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DepositEditorProps {
  initialDeposit: number;
  currency: string;
  onSave: (value: number) => void;
  label?: string;
  sx?: SxProps<Theme>;
}

export const DepositEditor: React.FC<DepositEditorProps> = React.memo(
  ({ initialDeposit, currency, onSave, label, sx }) => {
    const { t } = useTranslation();
    const [val, setVal] = useState(String(initialDeposit));

    useEffect(() => {
      setVal(String(initialDeposit));
    }, [initialDeposit]);

    const handleBlur = useCallback(() => {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        onSave(parsed);
      } else {
        setVal(String(initialDeposit));
      }
    }, [val, initialDeposit, onSave]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleBlur();
          (e.target as HTMLElement).blur();
        }
      },
      [handleBlur]
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setVal(e.target.value);
    }, []);

    return (
      <TextField
        size="small"
        label={label || t('banner.initialDeposit', { defaultValue: t('table.initialDeposit') })}
        value={val}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{ '& p': { fontSize: '0.8rem', fontWeight: 600 } }}
              >
                {currency}
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.85rem',
              fontFamily: "'JetBrains Mono', monospace",
              width: 140,
              height: 32,
            },
          },
        }}
        sx={sx}
      />
    );
  }
);

DepositEditor.displayName = 'DepositEditor';
