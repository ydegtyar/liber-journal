import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseBrokerCsv } from './lib/csvParser';
import { calculateAnalytics, calculateDrawdowns, calculateGroupSummaries } from './lib/calculations';
import { generateXlsxWorkbook } from './lib/xlsxTemplate';
import { DEFAULT_JOURNAL_SETTINGS } from './types/preferences';

describe('Trading Journal End-to-End Integration', () => {
  it('parses real Libertex export, calculates institutional metrics, and exports dynamic XLSX', async () => {
    // 1. Read Libertex sample CSV
    const csvPath = path.resolve(__dirname, '../sample_data/closed_deals_on_02_09_26.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');

    // 2. Parse CSV
    const parseResult = parseBrokerCsv(content);
    expect(parseResult.trades.length).toBe(23);
    expect(parseResult.checksumPassed).toBe(true);
    expect(parseResult.metadata.currency).toBe('USD');

    // 3. Calculate Analytics
    const initialDeposit = 1000;
    const analytics = calculateAnalytics(initialDeposit, parseResult.trades);

    expect(analytics.totalTrades).toBe(23);
    expect(analytics.netPnl).toBe(65.09);
    expect(analytics.currentDeposit).toBe(1065.09);
    expect(analytics.roiPercent).toBe(6.51);

    // Losing trades in Libertex sample: USD/PLN deal USDPLN-144163459 has pnl: -0.21
    expect(analytics.losingTrades).toBe(1);
    expect(analytics.winningTrades).toBe(22);
    expect(analytics.breakevenTrades).toBe(0);
    // Win Rate = 22 / (22 + 1) * 100 = 95.65%
    expect(analytics.winRate).toBe(95.65);

    // Profit Factor: Gross Win / Gross Loss = (65.09 + 0.21) / 0.21 = 65.30 / 0.21 = 310.95
    expect(analytics.profitFactor).toBeGreaterThan(300);

    // Peak-to-Trough Drawdowns
    const { maxDrawdownAmount, equityCurve } = calculateDrawdowns(initialDeposit, parseResult.trades);
    expect(maxDrawdownAmount).toBe(0.21);
    expect(equityCurve.length).toBe(24);

    // Day grouping
    const dailySummaries = calculateGroupSummaries(parseResult.trades, 'day');
    expect(Object.keys(dailySummaries).length).toBeGreaterThanOrEqual(3);

    // 4. Export dynamic XLSX
    const xlsxBlob = await generateXlsxWorkbook(parseResult.trades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit,
    });
    expect(xlsxBlob).toBeDefined();
    expect(xlsxBlob.size).toBeGreaterThan(2000);
  });
});
