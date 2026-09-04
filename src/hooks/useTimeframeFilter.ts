import { useState, useMemo } from 'react';
import { Trade, TimeframeOption } from '../types/trade';

export interface UseTimeframeFilterResult {
  timeframe: TimeframeOption;
  setTimeframe: (tf: TimeframeOption) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  selectedInstrument: string | null;
  setSelectedInstrument: (instrument: string | null) => void;
  filteredTrades: Trade[];
  dateRangeLabel: string;
}

export function useTimeframeFilter(trades: Trade[]): UseTimeframeFilterResult {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);

  // Reference date: latest closed trade or current date
  const latestTradeDate = useMemo(() => {
    if (trades.length === 0) return new Date();
    let maxTime = 0;
    for (const t of trades) {
      const time = new Date(t.closedAt).getTime();
      if (!isNaN(time) && time > maxTime) {
        maxTime = time;
      }
    }
    return maxTime > 0 ? new Date(maxTime) : new Date();
  }, [trades]);

  const { filteredTrades, dateRangeLabel } = useMemo(() => {
    let result = [...trades];

    // Filter by instrument if selected
    if (selectedInstrument) {
      result = result.filter(
        (t) => (t.instrument || '').toLowerCase() === selectedInstrument.toLowerCase()
      );
    }

    if (timeframe === 'ALL' || result.length === 0) {
      if (result.length === 0) {
        return { filteredTrades: [], dateRangeLabel: '—' };
      }
      const sorted = [...result].sort(
        (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
      );
      const minDate = formatDateRangePart(sorted[0].closedAt);
      const maxDate = formatDateRangePart(sorted[sorted.length - 1].closedAt);
      const label = minDate === maxDate ? minDate : `${minDate} – ${maxDate}`;
      return { filteredTrades: result, dateRangeLabel: label };
    }

    const ref = new Date(latestTradeDate);
    let startTimestamp = 0;
    let endTimestamp = Number.MAX_SAFE_INTEGER;

    if (timeframe === '1D') {
      const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
      startTimestamp = dayStart.getTime();
      endTimestamp = dayEnd.getTime();
    } else if (timeframe === '7D') {
      const dayEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
      const dayStart = new Date(dayEnd.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);
      startTimestamp = dayStart.getTime();
      endTimestamp = dayEnd.getTime();
    } else if (timeframe === '30D') {
      const dayEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
      const dayStart = new Date(dayEnd.getTime() - 30 * 24 * 60 * 60 * 1000 + 1);
      startTimestamp = dayStart.getTime();
      endTimestamp = dayEnd.getTime();
    } else if (timeframe === 'WTD') {
      const d = new Date(ref);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      startTimestamp = monday.getTime();
      endTimestamp = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999).getTime();
    } else if (timeframe === 'MTD') {
      const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
      startTimestamp = monthStart.getTime();
      endTimestamp = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999).getTime();
    } else if (timeframe === 'YTD') {
      const yearStart = new Date(ref.getFullYear(), 0, 1, 0, 0, 0, 0);
      startTimestamp = yearStart.getTime();
      endTimestamp = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999).getTime();
    } else if (timeframe === 'CUSTOM') {
      if (customStartDate) {
        startTimestamp = new Date(customStartDate).getTime();
      }
      if (customEndDate) {
        const d = new Date(customEndDate);
        d.setHours(23, 59, 59, 999);
        endTimestamp = d.getTime();
      }
    }

    const filtered = result.filter((t) => {
      const time = new Date(t.closedAt).getTime();
      return !isNaN(time) && time >= startTimestamp && time <= endTimestamp;
    });

    const startStr = formatDateRangePart(new Date(startTimestamp).toISOString());
    const endStr = formatDateRangePart(new Date(Math.min(endTimestamp, Date.now() + 86400000)).toISOString());
    const label = startStr === endStr ? startStr : `${startStr} – ${endStr}`;

    return { filteredTrades: filtered, dateRangeLabel: label };
  }, [trades, selectedInstrument, timeframe, latestTradeDate, customStartDate, customEndDate]);

  return {
    timeframe,
    setTimeframe,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedInstrument,
    setSelectedInstrument,
    filteredTrades,
    dateRangeLabel,
  };
}

function formatDateRangePart(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
