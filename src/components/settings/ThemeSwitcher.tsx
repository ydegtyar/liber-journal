import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../../types/preferences';

interface ThemeSwitcherProps {
  currentMode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentMode, onChange }) => {
  const { t } = useTranslation();

  const handleThemeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ThemeMode | null
  ) => {
    if (newMode) {
      onChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentMode}
      exclusive
      onChange={handleThemeChange}
      size="small"
      aria-label="Theme switcher"
      sx={{
        height: 32,
        '& .MuiToggleButton-root': {
          px: 1,
          py: 0.3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          color: (theme) => theme.palette.text.secondary,
          '&.Mui-selected': {
            backgroundColor: (theme) => theme.palette.action.selected,
            color: (theme) => theme.palette.primary.main,
          },
        },
      }}
    >
      <Tooltip title={t('theme.light')}>
        <ToggleButton value="light" aria-label="Light mode">
          <LightModeIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={t('theme.dark')}>
        <ToggleButton value="dark" aria-label="Dark mode">
          <DarkModeIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={t('theme.midnight')}>
        <ToggleButton value="midnight" aria-label="Dark Midnight mode">
          <NightsStayIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={t('theme.unicorn')}>
        <ToggleButton value="unicorn" aria-label="Unicorn mode">
          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={t('theme.system')}>
        <ToggleButton value="system" aria-label="System mode">
          <SettingsBrightnessIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};
