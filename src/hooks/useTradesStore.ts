import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearAllTrades } from '../lib/db';
import { Trade } from '../types/trade';

const EMPTY_TRADES: Trade[] = [];

export function useTradesStore() {
  const trades = useLiveQuery(async () => {
    return await db.trades.toArray();
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
