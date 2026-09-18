import { describe, it, expect } from 'vitest';
import enLocale from '../../i18n/locales/en.json';
import ukLocale from '../../i18n/locales/uk.json';
import { InstrumentSummary } from '../../types/trade';

describe('InstrumentsTable i18n and filtering logic', () => {
  const mockInstruments: InstrumentSummary[] = [
    {
      symbol: 'BTCUSDT',
      trades: 12,
      winRate: 75,
      netPnl: 1450.5,
      avgPnl: 120.875,
      sharePercent: 35.5,
      sparkline: [100, 200, 300],
    },
    {
      symbol: 'ETHUSDT',
      trades: 8,
      winRate: 50,
      netPnl: -220.0,
      avgPnl: -27.5,
      sharePercent: 24.5,
      sparkline: [-50, -100, -220],
    },
    {
      symbol: 'SOLUSDT',
      trades: 5,
      winRate: 60,
      netPnl: 340.0,
      avgPnl: 68.0,
      sharePercent: 40.0,
      sparkline: [50, 150, 340],
    },
  ];

  it('contains all required i18n keys in en and uk translations', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'instrument',
      'trades',
      'winRate',
      'netPnl',
      'avg',
      'share',
      'trend',
      'details',
      'filterPlaceholder',
      'filterLabel',
      'clearFilter',
      'noMatchingInstruments',
      'tableAria',
    ] as const;

    for (const key of requiredKeys) {
      expect(enLocale.instruments).toHaveProperty(key);
      expect(ukLocale.instruments).toHaveProperty(key);
      expect((enLocale.instruments as Record<string, string>)[key]).toBeTruthy();
      expect((ukLocale.instruments as Record<string, string>)[key]).toBeTruthy();
    }
  });

  it('filters instruments by symbol case-insensitively and with trimmed input', () => {
    const filterInstruments = (data: InstrumentSummary[], query: string) => {
      if (!query.trim()) return data;
      const q = query.trim().toLowerCase();
      return data.filter((item) => item.symbol.toLowerCase().includes(q));
    };

    expect(filterInstruments(mockInstruments, 'btc')).toHaveLength(1);
    expect(filterInstruments(mockInstruments, 'btc')[0].symbol).toBe('BTCUSDT');

    expect(filterInstruments(mockInstruments, '  ETH  ')).toHaveLength(1);
    expect(filterInstruments(mockInstruments, '  ETH  ')[0].symbol).toBe('ETHUSDT');

    expect(filterInstruments(mockInstruments, 'usdt')).toHaveLength(3);
    expect(filterInstruments(mockInstruments, 'NONEXISTENT')).toHaveLength(0);
    expect(filterInstruments(mockInstruments, '   ')).toHaveLength(3);
  });
});
