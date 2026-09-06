import React, { useCallback } from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../../types/preferences';

interface Props {
  currentMode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export const ThemeSwitcher: React.FC<Props> = React.memo(({ currentMode, onChange }) => {
  const { t } = useTranslation();

  const handleThemeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newMode: ThemeMode | null) => {
      if (newMode) {
        onChange(newMode);
      }
    },
    [onChange]
  );

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
      <ToggleButton
        value="light"
        aria-label="Light mode"
        selected={currentMode === 'light'}
        onClick={() => onChange('light')}
      >
        <Tooltip title={t('theme.light')} arrow>
          <LightModeIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </ToggleButton>

      <ToggleButton
        value="dark"
        aria-label="Dark mode"
        selected={currentMode === 'dark'}
        onClick={() => onChange('dark')}
      >
        <Tooltip title={t('theme.dark')} arrow>
          <DarkModeIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </ToggleButton>

      <ToggleButton
        value="midnight"
        aria-label="Dark Midnight mode"
        selected={currentMode === 'midnight'}
        onClick={() => onChange('midnight')}
      >
        <Tooltip title={t('theme.midnight')} arrow>
          <NightsStayIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </ToggleButton>

      <ToggleButton
        value="unicorn"
        aria-label="Unicorn mode"
        selected={currentMode === 'unicorn'}
        onClick={() => onChange('unicorn')}
      >
        <Tooltip title={t('theme.unicorn')} arrow>
          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </ToggleButton>

      <ToggleButton
        value="system"
        aria-label="System mode"
        selected={currentMode === 'system'}
        onClick={() => onChange('system')}
      >
        <Tooltip title={t('theme.system')} arrow>
          <SettingsBrightnessIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';
