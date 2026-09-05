import { describe, it, expect } from 'vitest';
import { MOBILE_THEME_OPTIONS } from './mobileThemeOptions';
import { ThemeMode } from '../../types/preferences';

describe('JournalHeader mobile configurations', () => {
  it('contains all 5 supported theme modes', () => {
    const expectedModes: ThemeMode[] = ['light', 'dark', 'midnight', 'unicorn', 'system'];
    const definedModes = MOBILE_THEME_OPTIONS.map((opt) => opt.mode);

    expect(definedModes).toEqual(expectedModes);
  });

  it('provides valid translation keys and icons for each mobile theme option', () => {
    MOBILE_THEME_OPTIONS.forEach((option) => {
      expect(option.labelKey).toBe(`theme.${option.mode}`);
      expect(option.icon).toBeDefined();
    });
  });

  it('verifies layoutSettings title translation exists for header settings button', async () => {
    const enLocale = await import('../../i18n/locales/en.json');
    const ukLocale = await import('../../i18n/locales/uk.json');

    expect(enLocale.default.layoutSettings.title).toBeTruthy();
    expect(ukLocale.default.layoutSettings.title).toBeTruthy();
  });
});
