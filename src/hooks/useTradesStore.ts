import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearAllTrades } from '../lib/db';
import { Trade } from '../types/trade';

export function useTradesStore() {
  const trades = useLiveQuery(async () => {
    return await db.trades.toArray();
  }, []);

  const addTrade = async (trade: Trade) => {
    await db.trades.add(trade);
  };

  const updateTrade = async (trade: Trade) => {
    await db.trades.put(trade);
  };

  const deleteTrade = async (id: string) => {
    await db.trades.delete(id);
  };

  const clearAll = async () => {
    await clearAllTrades();
  };

  return {
    trades: trades || [],
    isLoading: trades === undefined,
    addTrade,
    updateTrade,
    deleteTrade,
    clearAll,
  };
}
