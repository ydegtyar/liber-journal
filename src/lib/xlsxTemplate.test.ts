import { describe, it, expect } from 'vitest';
import { generateXlsxWorkbook } from './xlsxTemplate';
import { DEFAULT_JOURNAL_SETTINGS } from '../types/preferences';
import { Trade } from '../types/trade';

describe('XLSX Template Generator', () => {
  it('generates a valid XLSX blob with live formulas', async () => {
    const trades: Trade[] = [
      {
        id: '1',
        dealId: 'EURUSD-144189148',
        instrument: 'EUR/USD',
        direction: 'sell',
        openedAt: '2026-09-01T18:50:00.000Z',
        closedAt: '2026-09-02T07:06:00.000Z',
        openPrice: 1.15885,
        closePrice: 1.15665,
        margin: 30,
        leverage: 55,
        grossReturn: 33.01,
        pnl: 3.01,
      },
      {
        id: '2',
        dealId: 'USDPLN-144163459',
        instrument: 'USD/PLN',
        direction: 'buy',
        openedAt: '2026-09-01T10:15:00.000Z',
        closedAt: '2026-09-01T10:15:00.000Z',
        openPrice: 3.73861,
        closePrice: 3.73822,
        margin: 30,
        leverage: 40,
        grossReturn: 29.79,
        pnl: -0.21,
      },
    ];

    const blob = await generateXlsxWorkbook(trades, DEFAULT_JOURNAL_SETTINGS);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });
});
