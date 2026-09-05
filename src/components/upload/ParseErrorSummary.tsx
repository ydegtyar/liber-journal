import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ParseResult } from '../../lib/csvParser';

interface ParseErrorSummaryProps {
  open: boolean;
  onClose: () => void;
  result: ParseResult | null;
}

export const ParseErrorSummary: React.FC<ParseErrorSummaryProps> = React.memo(
  ({ open, onClose, result }) => {
    const { t } = useTranslation();

    if (!result) return null;

    const hasErrors = result.errors.length > 0;
    const hasWarnings = result.warnings.length > 0;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {hasErrors ? 'CSV Import Failed' : 'CSV Import Diagnostics'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hasErrors && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Critical Errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.errors.map((err, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{err}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {hasWarnings && (
              <Alert severity="warning">
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Warnings / Checksum Notes:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.warnings.map((warn, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{warn}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {result.trades.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Successfully parsed {result.trades.length} trades.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" size="small">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ParseErrorSummary.displayName = 'ParseErrorSummary';
