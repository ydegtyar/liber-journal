import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DepositEditorProps {
  initialDeposit: number;
  currency: string;
  onSave: (value: number) => void;
}

export const DepositEditor: React.FC<DepositEditorProps> = ({
  initialDeposit,
  currency,
  onSave,
}) => {
  const { t } = useTranslation();
  const [val, setVal] = useState(String(initialDeposit));

  useEffect(() => {
    setVal(String(initialDeposit));
  }, [initialDeposit]);

  const handleBlur = () => {
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
    } else {
      setVal(String(initialDeposit));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <TextField
      size="small"
      label={t('table.initialDeposit')}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ '& p': { fontSize: '0.8rem', fontWeight: 600 } }}>
              {currency}
            </InputAdornment>
          ),
          sx: {
            fontSize: '0.85rem',
            fontFamily: "'JetBrains Mono', monospace",
            width: 140,
            height: 34,
          },
        },
      }}
    />
  );
};
