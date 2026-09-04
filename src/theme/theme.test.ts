import { describe, it, expect } from 'vitest';
import { buildAppTheme } from './theme';
import { ThemeMode } from '../types/preferences';

describe('buildAppTheme', () => {
  const modes: ThemeMode[] = ['light', 'dark', 'midnight', 'unicorn', 'system'];

  it.each(modes)('builds valid MUI theme for mode: %s', (mode) => {
    const theme = buildAppTheme(mode, 'dark');
    expect(theme).toBeDefined();
    expect(theme.palette).toBeDefined();
    expect(theme.palette.trade).toBeDefined();
    expect(theme.palette.trade.gain).toBeDefined();
    expect(theme.palette.trade.loss).toBeDefined();
  });

  it('switches system mode dynamically based on systemColor', () => {
    const darkSystem = buildAppTheme('system', 'dark');
    expect(darkSystem.palette.mode).toBe('dark');

    const lightSystem = buildAppTheme('system', 'light');
    expect(lightSystem.palette.mode).toBe('light');
  });

  it('distinguishes unicorn theme with unique vibrant palette', () => {
    const unicorn = buildAppTheme('unicorn', 'dark');
    expect(unicorn.palette.primary.main).toBe('#00F5D4');
    expect(unicorn.palette.secondary.main).toBe('#38BDF8');
  });
});
