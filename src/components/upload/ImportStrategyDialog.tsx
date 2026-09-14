import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  Chip,
  alpha,
  CircularProgress,
} from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useTranslation } from 'react-i18next';

export type ImportStrategy = 'merge' | 'replace';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (strategy: ImportStrategy) => void;
  isProcessing?: boolean;
  pendingTradeCount?: number;
}

export const ImportStrategyDialog: React.FC<Props> = React.memo(
  ({ open, onClose, onConfirm, isProcessing = false, pendingTradeCount }) => {
    const { t } = useTranslation();
    const [selectedStrategy, setSelectedStrategy] = useState<ImportStrategy>('merge');

    // Reset to default 'merge' whenever dialog opens
    useEffect(() => {
      if (open) {
        setSelectedStrategy('merge');
      }
    }, [open]);

    const handleConfirm = () => {
      onConfirm(selectedStrategy);
    };

    return (
      <Dialog
        open={open}
        onClose={isProcessing ? undefined : onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <FileUploadIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {t('importDialog.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pendingTradeCount
                ? `${t('importDialog.subtitle')} (${pendingTradeCount} incoming trades)`
                : t('importDialog.subtitle')}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Option 1: Merge with Existing (Default) */}
          <Box
            onClick={() => setSelectedStrategy('merge')}
            role="radio"
            aria-checked={selectedStrategy === 'merge'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                setSelectedStrategy('merge');
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              p: 2,
              borderRadius: 2,
              border: '2px solid',
              borderColor: (theme) =>
                selectedStrategy === 'merge' ? theme.palette.primary.main : theme.palette.divider,
              bgcolor: (theme) =>
                selectedStrategy === 'merge'
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.background.paper, 0.4),
              cursor: 'pointer',
              transition: 'all 0.18s ease-in-out',
              '&:hover': {
                borderColor: (theme) =>
                  selectedStrategy === 'merge'
                    ? theme.palette.primary.main
                    : theme.palette.text.disabled,
                bgcolor: (theme) =>
                  selectedStrategy === 'merge'
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <Radio
              checked={selectedStrategy === 'merge'}
              onChange={() => setSelectedStrategy('merge')}
              value="merge"
              name="import-strategy"
              color="primary"
              sx={{ p: 0.5, mt: 0.2 }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14),
                color: 'primary.main',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <CallMergeIcon fontSize="medium" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {t('importDialog.mergeTitle')}
                </Typography>
                <Chip
                  label={t('importDialog.mergeBadge')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.825rem', lineHeight: 1.45 }}
              >
                {t('importDialog.mergeDescription')}
              </Typography>
            </Box>
          </Box>

          {/* Option 2: Replace All Data */}
          <Box
            onClick={() => setSelectedStrategy('replace')}
            role="radio"
            aria-checked={selectedStrategy === 'replace'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                setSelectedStrategy('replace');
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              p: 2,
              borderRadius: 2,
              border: '2px solid',
              borderColor: (theme) =>
                selectedStrategy === 'replace' ? theme.palette.warning.main : theme.palette.divider,
              bgcolor: (theme) =>
                selectedStrategy === 'replace'
                  ? alpha(theme.palette.warning.main, 0.08)
                  : alpha(theme.palette.background.paper, 0.4),
              cursor: 'pointer',
              transition: 'all 0.18s ease-in-out',
              '&:hover': {
                borderColor: (theme) =>
                  selectedStrategy === 'replace'
                    ? theme.palette.warning.main
                    : theme.palette.text.disabled,
                bgcolor: (theme) =>
                  selectedStrategy === 'replace'
                    ? alpha(theme.palette.warning.main, 0.12)
                    : alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <Radio
              checked={selectedStrategy === 'replace'}
              onChange={() => setSelectedStrategy('replace')}
              value="replace"
              name="import-strategy"
              color="warning"
              sx={{ p: 0.5, mt: 0.2 }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.14),
                color: 'warning.main',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <DeleteSweepIcon fontSize="medium" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {t('importDialog.replaceTitle')}
                </Typography>
                <Chip
                  label={t('importDialog.replaceBadge')}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.825rem', lineHeight: 1.45 }}
              >
                {t('importDialog.replaceDescription')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isProcessing}>
            {t('importDialog.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minWidth: 110, fontWeight: 700 }}
          >
            {t('importDialog.continue')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ImportStrategyDialog.displayName = 'ImportStrategyDialog';
