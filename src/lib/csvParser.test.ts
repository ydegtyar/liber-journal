import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseBrokerCsv } from './csvParser';
import { calculateNetPnl } from './calculations';

describe('CSV Parser', () => {
  it('parses the Libertex sample export correctly with exact 23 trades and matching checksum', () => {
    const filePath = path.resolve(__dirname, '../../sample_data/closed_deals_on_02_09_26.csv');
    const content = fs.readFileSync(filePath, 'utf-8');

    const result = parseBrokerCsv(content);

    expect(result.errors).toEqual([]);
    expect(result.trades.length).toBe(23);
    expect(result.metadata.currency).toBe('USD');
    expect(result.metadata.accountHolder).toBe('DEMO TRADER');
    expect(result.metadata.accountNumber).toBe('9990001122');

    // Expected totals from row 30: Обсяг: 710 775.09 65.09
    expect(result.expectedTotals).toBeDefined();
    expect(result.expectedTotals?.pnl).toBe(65.09);
    expect(result.checksumPassed).toBe(true);

    const netPnl = calculateNetPnl(result.trades);
    expect(netPnl).toBe(65.09);

    // Verify first and losing trades
    const firstTrade = result.trades[0];
    expect(firstTrade.instrument).toBe('EUR/USD');
    expect(firstTrade.dealId).toBe('EURUSD-144189148');
    expect(firstTrade.direction).toBe('sell');
    expect(firstTrade.openPrice).toBe(1.15885);
    expect(firstTrade.closePrice).toBe(1.15665);
    expect(firstTrade.margin).toBe(30);
    expect(firstTrade.leverage).toBe(55);
    expect(firstTrade.grossReturn).toBe(33.01);
    expect(firstTrade.pnl).toBe(3.01);

    // Verify loss trade: USD/PLN at -0.21
    const lossTrade = result.trades.find((t) => t.instrument === 'USD/PLN' && t.pnl < 0);
    expect(lossTrade).toBeDefined();
    expect(lossTrade?.pnl).toBe(-0.21);
  });
});
