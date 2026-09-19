import { useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearAllTrades } from '../lib/db';
import { Trade } from '../types/trade';
import sampleTrades from '../sampleTrades.json';

const EMPTY_TRADES: Trade[] = [];

export function useTradesStore() {
  const trades = useLiveQuery(async () => {
    return await db.trades.toArray();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('demo=1')) {
      db.trades.count().then((cnt) => {
        if (cnt === 0) {
          db.trades.bulkAdd(sampleTrades as Trade[]);
        }
      });
    }
  }, []);

  const addTrade = useCallback(async (trade: Trade) => {
    await db.trades.add(trade);
  }, []);

  const updateTrade = useCallback(async (trade: Trade) => {
    await db.trades.put(trade);
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    await db.trades.delete(id);
  }, []);

  const clearAll = useCallback(async () => {
    await clearAllTrades();
  }, []);

  const tradeList = trades ?? EMPTY_TRADES;
  const isLoading = trades === undefined;

  return useMemo(
    () => ({
      trades: tradeList,
      isLoading,
      addTrade,
      updateTrade,
      deleteTrade,
      clearAll,
    }),
    [tradeList, isLoading, addTrade, updateTrade, deleteTrade, clearAll]
  );
}
