import React from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../settings/LanguageSelector';
import { ThemeSwitcher } from '../settings/ThemeSwitcher';
import { ThemeMode } from '../../types/preferences';

export interface JournalHeaderProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  themeMode,
  onThemeModeChange,
}) => {
  const { t } = useTranslation();

  return (
    <AppBar
      component="header"
      position="static"
      color="transparent"
      sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
    >
      <Toolbar
        component="nav"
        aria-label="Terminal Navigation"
        variant="dense"
        sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}
      >
        {/* Logo & Title (H1 Heading for SEO/GEO) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/favicon.svg"
            alt="Trading Journal Logo"
            sx={{
              width: 28,
              height: 28,
              display: 'block',
              flexShrink: 0,
            }}
          />
          <div>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {t('app.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              {t('app.subtitle')}
            </Typography>
          </div>
        </Box>

        {/* Right Toolbar Controls: Language & Theme Switchers */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LanguageSelector />
          <ThemeSwitcher currentMode={themeMode} onChange={onThemeModeChange} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
