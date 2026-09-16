import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseBrokerCsv, parseBrokerDate, combineDateAndTime } from './csvParser';
import { calculateNetPnl, calculateAvgTradeDuration } from './calculations';

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
    expect(firstTrade.openedAt).toBe('2026-09-01T18:50:00.000Z');
    expect(firstTrade.closedAt).toBe('2026-09-02T07:06:00.000Z');
    expect(firstTrade.openPrice).toBe(1.15885);
    expect(firstTrade.closePrice).toBe(1.15665);
    expect(firstTrade.margin).toBe(30);
    expect(firstTrade.leverage).toBe(55);
    expect(firstTrade.grossReturn).toBe(33.01);
    expect(firstTrade.pnl).toBe(3.01);

    // Verify all trades have valid 2026 dates from file, NOT current import date
    const todayYmd = new Date().toISOString().split('T')[0];
    for (const t of result.trades) {
      expect(t.openedAt).toContain('2026-');
      expect(t.closedAt).toContain('2026-');
      // None of the trades should have today's timestamp (unless today is 2026-09-01/02)
      if (!['2026-08-31', '2026-09-01', '2026-09-02'].includes(todayYmd)) {
        expect(t.openedAt.split('T')[0]).not.toBe(todayYmd);
        expect(t.closedAt.split('T')[0]).not.toBe(todayYmd);
      }
    }

    // Verify loss trade: USD/PLN at -0.21
    const lossTrade = result.trades.find((t) => t.instrument === 'USD/PLN' && t.pnl < 0);
    expect(lossTrade).toBeDefined();
    expect(lossTrade?.pnl).toBe(-0.21);
  });

  describe('parseBrokerDate', () => {
    it('parses 2-digit years correctly', () => {
      expect(parseBrokerDate('01.09.26 18:50')).toBe('2026-09-01T18:50:00.000Z');
      expect(parseBrokerDate('1/9/26 18:50')).toBe('2026-09-01T18:50:00.000Z');
    });

    it('parses MetaTrader dot-separated YYYY.MM.DD format', () => {
      expect(parseBrokerDate('2026.09.01 18:50:00')).toBe('2026-09-01T18:50:00.000Z');
    });

    it('parses space-separated ISO dates', () => {
      expect(parseBrokerDate('2026-09-01 18:50:00')).toBe('2026-09-01T18:50:00.000Z');
      expect(parseBrokerDate('2026-09-01 18:50')).toBe('2026-09-01T18:50:00.000Z');
    });

    it('parses 12-hour AM/PM formats', () => {
      expect(parseBrokerDate('1/9/2026 6:50 PM')).toBe('2026-09-01T18:50:00.000Z');
      expect(parseBrokerDate('1/9/2026 6:50 AM')).toBe('2026-09-01T06:50:00.000Z');
    });

    it('returns empty string or fallback on invalid/empty input instead of import date', () => {
      expect(parseBrokerDate('')).toBe('');
      expect(parseBrokerDate(null)).toBe('');
      expect(parseBrokerDate(undefined)).toBe('');
      expect(parseBrokerDate('not-a-date')).toBe('');
      expect(parseBrokerDate('', 'customFallback')).toBe('customFallback');
    });
  });

  describe('Bidirectional date fallback during CSV import', () => {
    it('mirrors open date when only open date is present in file', () => {
      const csv = `Instrument,Direction,Open Time,Open Price,Close Price,Margin,PnL\nEUR/USD,Buy,01.09.2026 10:00,1.1000,1.1050,100,50`;
      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(1);
      expect(res.trades[0].openedAt).toBe('2026-09-01T10:00:00.000Z');
      expect(res.trades[0].closedAt).toBe('2026-09-01T10:00:00.000Z');
    });

    it('mirrors close date when only close date is present in file', () => {
      const csv = `Instrument,Direction,Close Time,Open Price,Close Price,Margin,PnL\nGBP/USD,Sell,02.09.2026 15:30,1.3000,1.2950,100,50`;
      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(1);
      expect(res.trades[0].closedAt).toBe('2026-09-02T15:30:00.000Z');
      expect(res.trades[0].openedAt).toBe('2026-09-02T15:30:00.000Z');
    });
  });

  describe('Order open and close timestamps in imports', () => {
    it('parses order open time and order close time columns', () => {
      const csv = `Instrument,Direction,Order Open Time,Order Close Time,Open Price,Close Price,Margin,PnL
EUR/USD,Buy,2026-09-01 10:00:00,2026-09-01 11:30:00,1.1000,1.1050,100,50
GBP/USD,Sell,2026-09-01 12:00:00,2026-09-01 13:00:00,1.3000,1.2950,100,30`;

      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(2);
      expect(res.trades[0].openedAt).toBe('2026-09-01T10:00:00.000Z');
      expect(res.trades[0].closedAt).toBe('2026-09-01T11:30:00.000Z'); // 90 min
      expect(res.trades[1].openedAt).toBe('2026-09-01T12:00:00.000Z');
      expect(res.trades[1].closedAt).toBe('2026-09-01T13:00:00.000Z'); // 60 min

      // (90m + 60m) / 2 = 75m = 4,500,000 ms
      const avgDuration = calculateAvgTradeDuration(res.trades);
      expect(avgDuration).toBe(4500000);
    });

    it('parses Ukrainian order open and close time column headers', () => {
      const csv = `Інструмент,Напрямок,Час відкриття ордера,Час закриття ордера,Ціна відкриття,Ціна закриття,Сума ($),Прибуток ($)
EUR/USD,Купити,01.09.2026 10:00,01.09.2026 11:00,1.1000,1.1050,100,50`;

      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(1);
      expect(res.trades[0].openedAt).toBe('2026-09-01T10:00:00.000Z');
      expect(res.trades[0].closedAt).toBe('2026-09-01T11:00:00.000Z');
      expect(calculateAvgTradeDuration(res.trades)).toBe(3600000);
    });

    it('combines separate Date, Open Time, and Close Time columns', () => {
      const csv = `Instrument,Direction,Date,Open Time,Close Time,Open Price,Close Price,Margin,PnL
EUR/USD,Buy,01.09.2026,10:00,11:30,1.1000,1.1050,100,50`;

      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(1);
      expect(res.trades[0].openedAt).toBe('2026-09-01T10:00:00.000Z');
      expect(res.trades[0].closedAt).toBe('2026-09-01T11:30:00.000Z');
      expect(calculateAvgTradeDuration(res.trades)).toBe(5400000); // 1h 30m
    });

    it('combines separate Open Date, Open Time, Close Date, and Close Time columns', () => {
      const csv = `Instrument,Direction,Open Date,Open Time,Close Date,Close Time,Open Price,Close Price,Margin,PnL
EUR/USD,Buy,01.09.2026,10:00,02.09.2026,12:00,1.1000,1.1050,100,50`;

      const res = parseBrokerCsv(csv);
      expect(res.trades.length).toBe(1);
      expect(res.trades[0].openedAt).toBe('2026-09-01T10:00:00.000Z');
      expect(res.trades[0].closedAt).toBe('2026-09-02T12:00:00.000Z');
      expect(calculateAvgTradeDuration(res.trades)).toBe(93600000); // 26 hours
    });
  });

  describe('combineDateAndTime helper', () => {
    it('combines date and time strings accurately', () => {
      expect(combineDateAndTime('01.09.2026', '14:30')).toBe('2026-09-01T14:30:00.000Z');
      expect(combineDateAndTime('2026-09-01', '14:30:00')).toBe('2026-09-01T14:30:00.000Z');
    });

    it('handles date string that already includes time', () => {
      expect(combineDateAndTime('01.09.2026 14:30', '')).toBe('2026-09-01T14:30:00.000Z');
      expect(combineDateAndTime('2026-09-01T14:30:00.000Z', '')).toBe('2026-09-01T14:30:00.000Z');
    });

    it('handles time-only string with baseDate', () => {
      expect(combineDateAndTime('', '14:30', '2026-09-01')).toBe('2026-09-01T14:30:00.000Z');
      expect(combineDateAndTime('', '14:30', '01.09.2026')).toBe('2026-09-01T14:30:00.000Z');
    });

    it('returns empty string on empty inputs', () => {
      expect(combineDateAndTime('', '')).toBe('');
      expect(combineDateAndTime(null, undefined)).toBe('');
    });
  });
});
