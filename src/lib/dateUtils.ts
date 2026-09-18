/**
 * Date utility functions for grouping and formatting trades.
 * Kept separate from XLSX/Excel dependencies to avoid bundle bloat.
 */

/**
 * Helper to get date string in YYYY-MM-DD from ISO string.
 */
export function getTradeDateKey(isoString: string): string {
  if (!isoString) return 'Unknown';
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get month string in YYYY-MM from ISO string.
 */
export function getTradeMonthKey(isoString: string): string {
  if (!isoString) return 'Unknown';
  const match = isoString.match(/^(\d{4})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats YYYY-MM-DD to DD.MM.YYYY
 */
export function formatDisplayDate(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateKey;
}

/**
 * Formats Date to YYYY-MM-DD string using local time
 */
export function formatToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns default 3-month range ending on current date in YYYY-MM-DD format
 */
export function getDefault3MonthsRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const past = new Date(year, month - 3, day);
  const expectedMonth = (month - 3 + 12) % 12;
  if (past.getMonth() !== expectedMonth) {
    past.setDate(0);
  }

  return {
    startDate: formatToYMD(past),
    endDate: formatToYMD(now),
  };
}
