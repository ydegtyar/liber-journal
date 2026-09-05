import React, { useState } from 'react';
import {
  Box,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<'' | 'privacy' | 'terms'>('');

  const handleOpen = (type: 'privacy' | 'terms') => () => setOpen(type);
  const handleClose = () => setOpen('');

  const getContent = () => {
    switch (open) {
      case 'privacy':
        return t('legal.privacy');
      case 'terms':
        return t('legal.terms');
      default:
        return '';
    }
  };

  const getTitle = () => (open === 'privacy' ? t('legal.privacyTitle') : t('legal.termsTitle'));

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        textAlign: 'center',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Link component="button" variant="body2" onClick={handleOpen('privacy')} sx={{ mx: 1 }}>
        {t('legal.privacyLink')}
      </Link>
      <Link component="button" variant="body2" onClick={handleOpen('terms')} sx={{ mx: 1 }}>
        {t('legal.termsLink')}
      </Link>

      <Dialog
        open={!!open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: (theme) => theme.palette.background.paper } }}
      >
        <DialogTitle>{getTitle()}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {getContent()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('legal.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
