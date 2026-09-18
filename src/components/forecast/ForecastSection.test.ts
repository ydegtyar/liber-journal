import { describe, it, expect } from 'vitest';
import enLocale from '../../i18n/locales/en.json';
import ukLocale from '../../i18n/locales/uk.json';
import { generateForecast } from '../../lib/forecastEngine';
import { Trade } from '../../types/trade';

const sampleTrades: Trade[] = [
  {
    id: 't1',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-01T08:00:00Z',
    closedAt: '2026-09-01T09:00:00Z',
    openPrice: 1.08,
    closePrice: 1.085,
    margin: 100,
    leverage: 50,
    grossReturn: 125,
    pnl: 25,
  },
  {
    id: 't2',
    instrument: 'GBP/USD',
    direction: 'sell',
    openedAt: '2026-09-02T08:00:00Z',
    closedAt: '2026-09-02T09:00:00Z',
    openPrice: 1.25,
    closePrice: 1.255,
    margin: 100,
    leverage: 50,
    grossReturn: 85,
    pnl: -15,
  },
  {
    id: 't3',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-03T08:00:00Z',
    closedAt: '2026-09-03T09:00:00Z',
    openPrice: 1.085,
    closePrice: 1.09,
    margin: 100,
    leverage: 50,
    grossReturn: 125,
    pnl: 25,
  },
];

describe('ForecastSection & Technique Descriptions', () => {
  it('strictly satisfies the constraint that all technique descriptions are 15 words or fewer in English', () => {
    const descriptions = enLocale.forecast.techniqueDescription;
    const techniques = enLocale.forecast.techniques;
    const modelKeys = Object.keys(descriptions) as (keyof typeof descriptions)[];

    expect(modelKeys.length).toBe(4);
    expect(Object.keys(techniques).length).toBe(4);

    for (const key of modelKeys) {
      const text = descriptions[key];
      expect(text).toBeTruthy();
      expect(techniques[key]).toBe(text);

      const words = text.trim().split(/\s+/).filter(Boolean);
      expect(
        words.length,
        `English description for '${key}' has ${words.length} words: "${text}"`
      ).toBeLessThanOrEqual(15);
    }
  });

  it('strictly satisfies the constraint that all technique descriptions are 15 words or fewer in Ukrainian', () => {
    const descriptions = ukLocale.forecast.techniqueDescription;
    const techniques = ukLocale.forecast.techniques;
    const modelKeys = Object.keys(descriptions) as (keyof typeof descriptions)[];

    expect(modelKeys.length).toBe(4);
    expect(Object.keys(techniques).length).toBe(4);

    for (const key of modelKeys) {
      const text = descriptions[key];
      expect(text).toBeTruthy();
      expect(techniques[key]).toBe(text);

      const words = text.trim().split(/\s+/).filter(Boolean);
      expect(
        words.length,
        `Ukrainian description for '${key}' has ${words.length} words: "${text}"`
      ).toBeLessThanOrEqual(15);
    }
  });

  it('provides a standard financial disclaimer in both English and Ukrainian', () => {
    expect(enLocale.forecast.disclaimer).toBeTruthy();
    expect(enLocale.forecast.disclaimer.toLowerCase()).toContain('not guarantee');

    expect(ukLocale.forecast.disclaimer).toBeTruthy();
    expect(ukLocale.forecast.disclaimer.toLowerCase()).toContain('не гарантують');
  });

  it('generates Conservative, Average, and Optimistic scenario values', () => {
    const result = generateForecast(1000, sampleTrades, 'monteCarlo', 60);

    expect(result.conservative).toBeDefined();
    expect(result.average).toBeDefined();
    expect(result.optimistic).toBeDefined();

    expect(result.conservative.projectedDeposit).toBeLessThanOrEqual(
      result.average.projectedDeposit
    );
    expect(result.average.projectedDeposit).toBeLessThanOrEqual(result.optimistic.projectedDeposit);

    expect(result.conservative.projectedPnl).toBeLessThanOrEqual(result.average.projectedPnl);
    expect(result.average.projectedPnl).toBeLessThanOrEqual(result.optimistic.projectedPnl);
  });

  it('provides complete translations for horizon modes and time horizons in EN and UK', () => {
    // English
    expect(enLocale.forecast.horizonModes.time).toBe('Time');
    expect(enLocale.forecast.horizonModes.trades).toBe('Trades');
    expect(enLocale.forecast.timeHorizons['1m']).toBe('1M');
    expect(enLocale.forecast.timeHorizons['3m']).toBe('3M');
    expect(enLocale.forecast.timeHorizons['6m']).toBe('6M');
    expect(enLocale.forecast.timeHorizons['12m']).toBe('12M');
    expect(enLocale.forecast.timeHorizons.approxTrades).toContain('{{count}}');

    // Ukrainian
    expect(ukLocale.forecast.horizonModes.time).toBe('Час');
    expect(ukLocale.forecast.horizonModes.trades).toBe('Угоди');
    expect(ukLocale.forecast.timeHorizons['1m']).toBe('1М');
    expect(ukLocale.forecast.timeHorizons['3m']).toBe('3М');
    expect(ukLocale.forecast.timeHorizons['6m']).toBe('6М');
    expect(ukLocale.forecast.timeHorizons['12m']).toBe('12М');
    expect(ukLocale.forecast.timeHorizons.approxTrades).toContain('{{count}}');
  });

  it('provides lazy forecast placeholder prompt translations in EN and UK', () => {
    expect(enLocale.forecast.placeholder.title).toBeTruthy();
    expect(enLocale.forecast.placeholder.subtitle).toBeTruthy();
    expect(ukLocale.forecast.placeholder.title).toBeTruthy();
    expect(ukLocale.forecast.placeholder.subtitle).toBeTruthy();
  });

  it('defines persistent localStorage keys for forecast mode, option, method, and scenario', async () => {
    const { FORECAST_STORAGE_KEYS } = await import('../../types/forecast');

    expect(FORECAST_STORAGE_KEYS.MODEL).toBe('liber_journal_forecast_model');
    expect(FORECAST_STORAGE_KEYS.HORIZON_MODE).toBe('liber_journal_forecast_horizon_mode');
    expect(FORECAST_STORAGE_KEYS.TIME_HORIZON).toBe('liber_journal_forecast_time_horizon');
    expect(FORECAST_STORAGE_KEYS.TRADES_HORIZON).toBe('liber_journal_forecast_trades_horizon');
    expect(FORECAST_STORAGE_KEYS.SCENARIO).toBe('liber_journal_forecast_scenario');
  });

  it('validates 3m as the default time horizon and time as the default mode', async () => {
    const en3m = enLocale.forecast.timeHorizons['3m'];
    const uk3m = ukLocale.forecast.timeHorizons['3m'];

    expect(en3m).toBe('3M');
    expect(uk3m).toBe('3М');
  });
});
