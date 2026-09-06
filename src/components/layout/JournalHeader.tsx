import React, { useState, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../settings/LanguageSelector';
import { ThemeSwitcher } from '../settings/ThemeSwitcher';
import { ThemeMode } from '../../types/preferences';
import { SUPPORTED_LOCALES } from '../../i18n';
import { MOBILE_THEME_OPTIONS } from './mobileThemeOptions';

export interface Props {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onOpenSettings?: () => void;
}

export const JournalHeader: React.FC<Props> = React.memo(
  ({ themeMode, onThemeModeChange, onOpenSettings }) => {
    const { t, i18n } = useTranslation();
    const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
    const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);

    const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const isLangMenuOpen = Boolean(langAnchorEl);
    const isThemeMenuOpen = Boolean(themeAnchorEl);

    const activeThemeOption =
      MOBILE_THEME_OPTIONS.find((opt) => opt.mode === themeMode) ?? MOBILE_THEME_OPTIONS[1];

    const handleOpenLangMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setLangAnchorEl(event.currentTarget);
    }, []);

    const handleCloseLangMenu = useCallback(() => {
      setLangAnchorEl(null);
    }, []);

    const handleSelectLanguage = useCallback(
      (code: string) => {
        i18n.changeLanguage(code);
        setLangAnchorEl(null);
      },
      [i18n]
    );

    const handleOpenThemeMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setThemeAnchorEl(event.currentTarget);
    }, []);

    const handleCloseThemeMenu = useCallback(() => {
      setThemeAnchorEl(null);
    }, []);

    const handleSelectTheme = useCallback(
      (mode: ThemeMode) => {
        onThemeModeChange(mode);
        setThemeAnchorEl(null);
      },
      [onThemeModeChange]
    );

    return (
      <AppBar
        component="header"
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar
          component="nav"
          aria-label="Terminal Navigation"
          variant="dense"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1.5, sm: 2, md: 3 },
            minHeight: { xs: 48, sm: 48 },
            gap: 1,
          }}
        >
          {/* Logo & Title (H1 Heading for SEO/GEO) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src="/favicon.svg"
              alt="Trading Journal Logo"
              sx={{
                width: { xs: 24, sm: 28 },
                height: { xs: 24, sm: 28 },
                display: 'block',
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                variant="subtitle1"
                noWrap
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.15,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  letterSpacing: '-0.01em',
                }}
              >
                {t('app.title')}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  fontSize: '0.68rem',
                  display: { xs: 'none', sm: 'block' },
                  lineHeight: 1.1,
                }}
              >
                {t('app.subtitle')}
              </Typography>
            </Box>
          </Box>

          {/* Desktop Controls (Tablets in landscape / Desktop >= 900px): Full Toggle Groups */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <LanguageSelector />
            <ThemeSwitcher currentMode={themeMode} onChange={onThemeModeChange} />
            {onOpenSettings && (
              <Tooltip title={t('layoutSettings.title')} arrow>
                <IconButton
                  size="small"
                  onClick={onOpenSettings}
                  aria-label={t('layoutSettings.title')}
                  data-testid="header-settings-button"
                  sx={{
                    width: 32,
                    height: 32,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'text.primary',
                    },
                  }}
                >
                  <TuneIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Mobile / Tablet Controls (< 900px): Compact, Space-Saving Dropdowns */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            {/* Mobile Language Selector */}
            <Button
              size="small"
              variant="outlined"
              onClick={handleOpenLangMenu}
              aria-label="Language selector"
              aria-controls={isLangMenuOpen ? 'mobile-language-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isLangMenuOpen ? 'true' : undefined}
              startIcon={<TranslateIcon sx={{ fontSize: 16 }} />}
              sx={{
                height: 32,
                minWidth: 0,
                px: 1,
                py: 0.3,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'text.secondary',
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': {
                  borderColor: 'divider',
                  backgroundColor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              {currentLang}
            </Button>

            <Menu
              id="mobile-language-menu"
              anchorEl={langAnchorEl}
              open={isLangMenuOpen}
              onClose={handleCloseLangMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: {
                    mt: 0.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    minWidth: 140,
                  },
                },
              }}
            >
              {SUPPORTED_LOCALES.map((locale) => {
                const isSelected = currentLang === locale.code;
                return (
                  <MenuItem
                    key={locale.code}
                    selected={isSelected}
                    onClick={() => handleSelectLanguage(locale.code)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 0.75,
                      px: 2,
                      fontSize: '0.85rem',
                    }}
                  >
                    <ListItemText
                      primary={locale.label}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? 'primary.main' : 'inherit',
                      }}
                    />
                    {isSelected && (
                      <CheckIcon sx={{ fontSize: 16, color: 'primary.main', ml: 1.5 }} />
                    )}
                  </MenuItem>
                );
              })}
            </Menu>

            {/* Mobile Theme Switcher */}
            <Tooltip title={t(activeThemeOption.labelKey)} arrow>
              <IconButton
                size="small"
                onClick={handleOpenThemeMenu}
                aria-label="Theme switcher"
                aria-controls={isThemeMenuOpen ? 'mobile-theme-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isThemeMenuOpen ? 'true' : undefined}
                sx={{
                  width: 32,
                  height: 32,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                {activeThemeOption.icon}
              </IconButton>
            </Tooltip>

            <Menu
              id="mobile-theme-menu"
              anchorEl={themeAnchorEl}
              open={isThemeMenuOpen}
              onClose={handleCloseThemeMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: {
                    mt: 0.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    minWidth: 160,
                  },
                },
              }}
            >
              {MOBILE_THEME_OPTIONS.map((option) => {
                const isSelected = themeMode === option.mode;
                return (
                  <MenuItem
                    key={option.mode}
                    selected={isSelected}
                    onClick={() => handleSelectTheme(option.mode)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 0.75,
                      px: 1.5,
                      gap: 1.5,
                      fontSize: '0.85rem',
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, color: isSelected ? 'primary.main' : 'text.secondary' }}
                    >
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={t(option.labelKey)}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? 'primary.main' : 'inherit',
                      }}
                    />
                    {isSelected && (
                      <CheckIcon sx={{ fontSize: 16, color: 'primary.main', ml: 'auto' }} />
                    )}
                  </MenuItem>
                );
              })}
            </Menu>

            {/* Mobile Settings Button */}
            {onOpenSettings && (
              <Tooltip title={t('layoutSettings.title')} arrow>
                <IconButton
                  size="small"
                  onClick={onOpenSettings}
                  aria-label={t('layoutSettings.title')}
                  data-testid="header-settings-button-mobile"
                  sx={{
                    width: 32,
                    height: 32,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'text.primary',
                    },
                  }}
                >
                  <TuneIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }
);

JournalHeader.displayName = 'JournalHeader';
