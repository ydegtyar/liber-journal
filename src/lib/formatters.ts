import { NumberFormatOption } from '../types/preferences';

/**
 * Formats a number according to the chosen number formatting mode.
 */
function formatNumber(
  value: number | undefined | null,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    formatOption?: NumberFormatOption;
    locale?: string;
  } = {}
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    formatOption = 'locale',
    locale = 'en-US',
  } = options;

  if (formatOption === 'dot') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }

  if (formatOption === 'comma') {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }

  // formatOption === 'locale'
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats currency amount with currency code or symbol.
 */
export function formatCurrency(
  value: number | undefined | null,
  currency = 'USD',
  formatOption: NumberFormatOption = 'locale',
  locale = 'en-US'
): string {
  const formattedNum = formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    formatOption,
    locale,
  });

  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PLN: 'zł',
    UAH: '₴',
  };

  const symbol = symbols[currency] || `${currency} `;
  return `${symbol}${formattedNum}`;
}

/**
 * Formats price, preserving up to 5 decimals for forex/crypto.
 */
export function formatPrice(
  value: number | undefined | null,
  formatOption: NumberFormatOption = 'locale',
  locale = 'en-US'
): string {
  if (value === undefined || value === null || isNaN(value)) return '0';

  // Determine decimal places from value
  const str = String(value);
  const decimals = str.includes('.') ? str.split('.')[1].length : 2;
  const maxDecimals = Math.min(Math.max(decimals, 2), 5);

  return formatNumber(value, {
    minimumFractionDigits: Math.min(2, maxDecimals),
    maximumFractionDigits: maxDecimals,
    formatOption,
    locale,
  });
}

/**
 * Formats signed P&L with explicit +/- prefix.
 */
export function formatSignedPnl(
  value: number | undefined | null,
  currency = 'USD',
  formatOption: NumberFormatOption = 'locale',
  locale = 'en-US'
): {
  text: string;
  sign: '+' | '-' | '';
  isPositive: boolean;
  isNegative: boolean;
  isBreakeven: boolean;
} {
  const num = value || 0;
  const isPositive = num > 0.0001;
  const isNegative = num < -0.0001;
  const isBreakeven = !isPositive && !isNegative;

  const absFormatted = formatCurrency(Math.abs(num), currency, formatOption, locale);

  let sign: '+' | '-' | '' = '';
  let text = absFormatted;

  if (isPositive) {
    sign = '+';
    text = `+${absFormatted}`;
  } else if (isNegative) {
    sign = '-';
    text = `-${absFormatted}`;
  }

  return { text, sign, isPositive, isNegative, isBreakeven };
}

/**
 * Formats percentage value.
 */
export function formatPercent(
  value: number | undefined | null,
  decimals = 1,
  formatOption: NumberFormatOption = 'locale',
  locale = 'en-US'
): string {
  const num = value || 0;
  const formatted = formatNumber(num, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    formatOption,
    locale,
  });
  return `${formatted}%`;
}

/**
 * Formats ISO date string for display.
 */
export function formatDate(
  isoStr: string | undefined | null,
  locale = 'en-US',
  includeSeconds = false
): string {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  }).format(date);
}

/**
 * Duration unit abbreviations for different languages.
 */
interface DurationUnits {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const DURATION_UNITS: Record<string, DurationUnits> = {
  en: {
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
  },
  uk: {
    days: 'д',
    hours: 'год',
    minutes: 'хв',
    seconds: 'с',
  },
};

function getDurationUnits(locale = 'en-US'): DurationUnits {
  const lang = locale.toLowerCase().split(/[-_]/)[0];
  return DURATION_UNITS[lang] || DURATION_UNITS.en;
}

/**
 * Formats duration in milliseconds concisely (e.g., '45s', '15m', '2h 15m', '3d 4h').
 */
export function formatDurationMs(ms: number | undefined | null, locale = 'en-US'): string {
  if (ms === undefined || ms === null || isNaN(ms) || ms < 0) return '-';

  const units = getDurationUnits(locale);
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}${units.seconds}`;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}${units.days} ${hours}${units.hours}` : `${days}${units.days}`;
  }
  if (hours > 0) {
    return minutes > 0
      ? `${hours}${units.hours} ${minutes}${units.minutes}`
      : `${hours}${units.hours}`;
  }
  return seconds > 0
    ? `${minutes}${units.minutes} ${seconds}${units.seconds}`
    : `${minutes}${units.minutes}`;
}

/**
 * Formats duration in milliseconds with detailed breakdown (e.g., '1d 4h 15m 30s').
 */
export function formatDetailedDurationMs(ms: number | undefined | null, locale = 'en-US'): string {
  if (ms === undefined || ms === null || isNaN(ms) || ms < 0) return '-';

  const units = getDurationUnits(locale);
  const totalSeconds = Math.round(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${units.days}`);
  if (hours > 0) parts.push(`${hours}${units.hours}`);
  if (minutes > 0) parts.push(`${minutes}${units.minutes}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}${units.seconds}`);

  return parts.join(' ');
}

/**
 * Formats duration between two ISO date strings concisely (e.g., '45s', '15m', '2h 15m', '3d 4h').
 */
export function formatDuration(
  openedAt: string | undefined | null,
  closedAt: string | undefined | null,
  locale = 'en-US'
): string {
  if (!openedAt || !closedAt) return '-';
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return '-';

  return formatDurationMs(end - start, locale);
}

/**
 * Formats duration between two ISO date strings with detailed breakdown (e.g., '1d 4h 15m 30s').
 */
export function formatDetailedDuration(
  openedAt: string | undefined | null,
  closedAt: string | undefined | null,
  locale = 'en-US'
): string {
  if (!openedAt || !closedAt) return '-';
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return '-';

  return formatDetailedDurationMs(end - start, locale);
}
