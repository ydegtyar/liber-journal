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
