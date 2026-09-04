import { NumberFormatOption } from '../types/preferences';

/**
 * Formats a number according to the chosen number formatting mode.
 */
export function formatNumber(
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
): { text: string; sign: '+' | '-' | ''; isPositive: boolean; isNegative: boolean; isBreakeven: boolean } {
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
export function formatDate(isoStr: string | undefined | null, locale = 'en-US'): string {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
