import React from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { ThemeMode } from '../../types/preferences';

export interface MobileThemeOption {
  mode: ThemeMode;
  labelKey: string;
  icon: React.ReactElement;
}

export const MOBILE_THEME_OPTIONS: MobileThemeOption[] = [
  { mode: 'light', labelKey: 'theme.light', icon: <LightModeIcon sx={{ fontSize: 18 }} /> },
  { mode: 'dark', labelKey: 'theme.dark', icon: <DarkModeIcon sx={{ fontSize: 18 }} /> },
  { mode: 'midnight', labelKey: 'theme.midnight', icon: <NightsStayIcon sx={{ fontSize: 18 }} /> },
  { mode: 'unicorn', labelKey: 'theme.unicorn', icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} /> },
  {
    mode: 'system',
    labelKey: 'theme.system',
    icon: <SettingsBrightnessIcon sx={{ fontSize: 18 }} />,
  },
];
