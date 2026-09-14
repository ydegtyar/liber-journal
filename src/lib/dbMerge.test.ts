import { describe, it, expect } from 'vitest';
import { areTradeValuesEqual } from './db';
import { Trade } from '../types/trade';

describe('Trade Equality & Conflict Resolution Logic', () => {
  const baseTrade: Trade = {
    id: 'EURUSD-100',
    dealId: 'EURUSD-100',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-01T10:00:00Z',
    closedAt: '2026-09-01T11:00:00Z',
    openPrice: 1.15,
    closePrice: 1.155,
    margin: 100,
    leverage: 50,
    grossReturn: 125,
    pnl: 25,
    note: 'Initial note',
    tag: 'Breakout',
  };

  it('detects identical trade financial data as equal even with different user metadata', () => {
    const identicalDataTrade: Trade = {
      ...baseTrade,
      note: undefined, // no note in new import
      tag: undefined,
    };
    expect(areTradeValuesEqual(baseTrade, identicalDataTrade)).toBe(true);
  });

  it('detects conflict when pnl differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      pnl: 30, // changed pnl
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });

  it('detects conflict when close price differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      closePrice: 1.156,
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });

  it('detects conflict when open price differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      openPrice: 1.151,
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });

  it('detects conflict when closedAt differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      closedAt: '2026-09-01T11:30:00Z',
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });

  it('detects conflict when direction differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      direction: 'sell',
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });

  it('detects conflict when instrument differs', () => {
    const alteredTrade: Trade = {
      ...baseTrade,
      instrument: 'GBP/USD',
    };
    expect(areTradeValuesEqual(baseTrade, alteredTrade)).toBe(false);
  });
});
