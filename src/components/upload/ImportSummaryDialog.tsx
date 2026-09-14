import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  Chip,
  alpha,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useTranslation } from 'react-i18next';
import { ImportSummaryData } from '../../lib/db';

interface Props {
  open: boolean;
  onClose: () => void;
  summaryData: ImportSummaryData | null;
  warnings?: string[];
}

export const ImportSummaryDialog: React.FC<Props> = React.memo(
  ({ open, onClose, summaryData, warnings = [] }) => {
    const { t } = useTranslation();

    if (!summaryData) return null;

    const getTitle = () => {
      if (summaryData.mode === 'merge') return t('importSummary.mergeTitle');
      if (summaryData.mode === 'replace') return t('importSummary.replaceTitle');
      return t('importSummary.directTitle');
    };

    const getModeLabel = () => {
      if (summaryData.mode === 'merge') return t('importSummary.modeMerge');
      if (summaryData.mode === 'replace') return t('importSummary.modeReplace');
      return t('importSummary.modeDirect');
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
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
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.14),
              color: 'success.main',
            }}
          >
            <CheckCircleOutlineIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              {getTitle()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('importSummary.mode')}:
              </Typography>
              <Chip
                label={getModeLabel()}
                size="small"
                color={
                  summaryData.mode === 'merge'
                    ? 'primary'
                    : summaryData.mode === 'replace'
                      ? 'warning'
                      : 'success'
                }
                variant="outlined"
                sx={{ height: 18, fontSize: '0.675rem', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {summaryData.mode === 'merge' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* New trades added */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <AddCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.newTrades')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +{summaryData.importedCount}
                </Typography>
              </Paper>

              {/* Conflicts resolved */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <PublishedWithChangesIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.conflictsResolved')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {summaryData.conflictsResolvedCount}
                </Typography>
              </Paper>

              {/* Unchanged records kept */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CheckBoxOutlineBlankIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.unchangedTrades')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  {summaryData.unchangedCount}
                </Typography>
              </Paper>
            </Box>
          )}

          {summaryData.mode === 'replace' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Old trades deleted */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <RemoveCircleOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.deletedTrades')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                  -{summaryData.deletedCount}
                </Typography>
              </Paper>

              {/* New trades imported */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <AddCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.newTrades')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +{summaryData.importedCount}
                </Typography>
              </Paper>
            </Box>
          )}

          {summaryData.mode === 'direct' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* New trades added */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <AddCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {t('importSummary.newTrades')}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +{summaryData.importedCount}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Total trades in ledger summary card */}
          <Paper
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 22 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {t('importSummary.totalTrades')}
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.1rem' }}
            >
              {summaryData.totalCount}
            </Typography>
          </Paper>

          {/* Non-critical warnings note if any */}
          {warnings.length > 0 && (
            <Alert severity="info" sx={{ mt: 0.5, py: 0.5, fontSize: '0.78rem' }}>
              {warnings[0]}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={onClose} variant="contained" fullWidth sx={{ fontWeight: 700 }}>
            {t('importSummary.done')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ImportSummaryDialog.displayName = 'ImportSummaryDialog';
