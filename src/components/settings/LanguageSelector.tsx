import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '../../i18n';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLang: string | null
  ) => {
    if (newLang) {
      i18n.changeLanguage(newLang);
    }
  };

  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

  return (
    <ToggleButtonGroup
      value={currentLang}
      exclusive
      onChange={handleLanguageChange}
      size="small"
      aria-label="Language selector"
      sx={{
        height: 32,
        '& .MuiToggleButton-root': {
          px: 1.2,
          py: 0.3,
          fontSize: '0.75rem',
          fontWeight: 600,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          color: (theme) => theme.palette.text.secondary,
          '&.Mui-selected': {
            backgroundColor: (theme) => theme.palette.action.selected,
            color: (theme) => theme.palette.text.primary,
          },
        },
      }}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <ToggleButton key={locale.code} value={locale.code}>
          {locale.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
