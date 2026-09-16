import Papa from 'papaparse';
import { Trade, Direction, AccountMetadata } from '../types/trade';
import { matchCanonicalField } from './csvColumnMap';

export interface ParseResult {
  trades: Trade[];
  metadata: AccountMetadata;
  expectedTotals?: {
    margin?: number;
    grossReturn?: number;
    pnl?: number;
  };
  checksumPassed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parses diverse broker date formats into an ISO 8601 string.
 * Supports:
 * - ISO formats (2026-09-01T18:50:00Z, with timezone or local)
 * - Space-separated ISO (2026-09-01 18:50:00, 2026-09-01 18:50)
 * - Dot-separated (01.09.2026 18:50:00, 1.9.2026 18:50, 2026.09.01 18:50:00)
 * - Slash-separated (1/9/2026 18:50, 01/09/2026 18:50:00, 2026/09/01 18:50)
 * - Dash-separated (01-09-2026 18:50:00)
 * - 2-digit years (01.09.26 18:50, 1/9/26 18:50)
 * - 12-hour AM/PM times (9/1/2026 6:50 PM, 01.09.2026 06:50:00 AM)
 * - Text months (01 Sep 2026 18:50, Sep 1, 2026 18:50)
 * - Unix timestamps (seconds or milliseconds) and Excel serial numbers
 *
 * Never returns the import date (new Date().toISOString()).
 * Returns fallback (default: '') if input is missing or unparseable.
 */
export function parseBrokerDate(dateStr: unknown, fallback = '', baseDate = ''): string {
  if (dateStr === undefined || dateStr === null) return fallback;
  const str = String(dateStr).trim();
  if (!str) return fallback;

  // 1. Numeric timestamp or Excel serial date
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    // Excel serial date (~1982 to 2078)
    if (num > 25000 && num < 80000) {
      const ms = (num - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Unix seconds (10 digits: ~1970 to 2286)
    if (num >= 1000000000 && num < 10000000000) {
      const d = new Date(num * 1000);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Unix milliseconds (11-14 digits)
    if (num >= 10000000000 && num < 100000000000000) {
      const d = new Date(num);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Microseconds (15-17 digits)
    if (num >= 100000000000000) {
      const d = new Date(Math.round(num / 1000));
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // 2. Standard ISO 8601 with T
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 3. Check for AM/PM
  let isPM = false;
  let hasAmPm = false;
  let cleanStr = str;
  if (/\b(pm|am)\b/i.test(cleanStr)) {
    hasAmPm = true;
    isPM = /\bpm\b/i.test(cleanStr);
    cleanStr = cleanStr.replace(/\s*(am|pm)\b/gi, '').trim();
  }

  // 4. Format: YYYY[-/.]MM[-/.]DD [HH:mm[:ss]]
  const ymdMatch = cleanStr.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    let hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const second = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;

    if (hasAmPm) {
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }

    const parsed = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  // 5. Format: DD[-/.]MM[-/.](YYYY|YY) [HH:mm[:ss]]
  const dmyMatch = cleanStr.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year += year < 70 ? 2000 : 1900;
    }

    let day = p1;
    let month = p2 - 1;
    // Disambiguate if p1 is month and p2 is day (> 12)
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1 - 1;
    }

    let hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    if (hasAmPm) {
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }

    const parsed = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  // 6. Format: HH:mm[:ss] (time only with base date)
  const timeOnlyMatch = cleanStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnlyMatch && baseDate) {
    let hour = parseInt(timeOnlyMatch[1], 10);
    const minute = parseInt(timeOnlyMatch[2], 10);
    const second = timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3], 10) : 0;

    if (hasAmPm) {
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }

    let baseIso = baseDate;
    if (baseDate && !baseDate.includes('T')) {
      baseIso = parseBrokerDate(baseDate);
    }
    const baseParsed = new Date(baseIso);
    if (!isNaN(baseParsed.getTime())) {
      const parsed = new Date(
        Date.UTC(
          baseParsed.getUTCFullYear(),
          baseParsed.getUTCMonth(),
          baseParsed.getUTCDate(),
          hour,
          minute,
          second
        )
      );
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  // 7. Direct Date parse fallback (handles "01 Sep 2026", "Sep 1, 2026")
  const direct = new Date(cleanStr);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  return fallback;
}

/**
 * Combines separate date and time strings into an ISO string.
 * Handles cases where date string already contains time or where only time is given with a baseDate.
 */
export function combineDateAndTime(
  dateStr?: unknown,
  timeStr?: unknown,
  baseDate?: string
): string {
  const d = dateStr !== undefined && dateStr !== null ? String(dateStr).trim() : '';
  const t = timeStr !== undefined && timeStr !== null ? String(timeStr).trim() : '';

  if (d && t) {
    // If date already includes time (e.g. contains ':' or 'T'), parse it directly
    if (d.includes(':') || d.includes('T')) {
      const parsed = parseBrokerDate(d, '', baseDate);
      if (parsed) return parsed;
    }
    // Otherwise concatenate date and time
    const combined = `${d} ${t}`;
    const parsedCombined = parseBrokerDate(combined, '', baseDate);
    if (parsedCombined) return parsedCombined;
    return parseBrokerDate(d, '', baseDate);
  }

  if (d) {
    return parseBrokerDate(d, '', baseDate);
  }

  if (t) {
    return parseBrokerDate(t, '', baseDate);
  }

  return '';
}

/**
 * Normalizes number string by handling commas, spaces, currency symbols, and multipliers.
 */
function parseBrokerNumber(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  const str = String(val)
    .trim()
    .replace(/[$\s€£]/g, '')
    .replace(/x/gi, '')
    .replace(/,/g, '.');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes trade direction (buy / sell).
 */
function parseDirection(val: string): Direction {
  const norm = val.trim().toLowerCase();
  if (norm === 'продати' || norm === 'продать' || norm === 'sell' || norm === 'short') {
    return 'sell';
  }
  return 'buy';
}

/**
 * Parses raw CSV/TSV text from broker exports.
 */
export function parseBrokerCsv(csvContent: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Strip BOM if present
  let cleanContent = csvContent;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    cleanContent = cleanContent.slice(1);
  }

  // Parse all lines into 2D array of strings
  const parsed = Papa.parse<string[]>(cleanContent, {
    skipEmptyLines: false,
    header: false,
    dynamicTyping: false,
  });

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    return {
      trades: [],
      metadata: { currency: 'USD' },
      checksumPassed: false,
      errors: ['File is empty'],
      warnings: [],
    };
  }

  // 1. Extract metadata from pre-header rows
  const metadata: AccountMetadata = {
    currency: 'USD',
  };

  let headerRowIndex = -1;
  const columnIndices: Record<string, number> = {};

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];

    // Check for Account metadata (e.g. "Рахунок:", "Account:", "Валюта:", "Currency:")
    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || '').trim();
      const nextCell = (row[c + 1] || '').trim();

      if (/^(рахунок|счет|account):?$/i.test(cell) && nextCell) {
        metadata.accountNumber = nextCell;
      }
      if (/^(ім’я|имя|name|holder):?$/i.test(cell) && nextCell) {
        metadata.accountHolder = nextCell;
      }
      if (/^(валюта|currency):?$/i.test(cell) && nextCell) {
        metadata.currency = nextCell;
      }
      if (/^(дата звіту|дата отчета|report date):?$/i.test(cell) && nextCell) {
        metadata.reportDate = nextCell;
      }
    }

    // Check if this row is the column header row
    let matchedCount = 0;
    const tempIndices: Record<string, number> = {};

    for (let c = 0; c < row.length; c++) {
      const colName = row[c];
      if (!colName) continue;
      const canonical = matchCanonicalField(colName);
      if (canonical) {
        tempIndices[canonical] = c;
        matchedCount++;
      }
    }

    // If at least 4 known fields match (e.g. instrument, direction, openPrice, pnl), this is the header row
    if (matchedCount >= 4) {
      headerRowIndex = r;
      Object.assign(columnIndices, tempIndices);
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      trades: [],
      metadata,
      checksumPassed: false,
      errors: ['Could not locate trade column headers in CSV file.'],
      warnings: [],
    };
  }

  // 2. Parse trades starting after headerRowIndex
  const trades: Trade[] = [];
  let expectedTotals: { margin?: number; grossReturn?: number; pnl?: number } | undefined;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => !cell || !cell.trim())) {
      continue; // Skip blank lines
    }

    const firstCell = (row[0] || '').trim().toLowerCase();

    // Check for footer / totals row (e.g. "Обсяг:", "Total:", "Итого:")
    if (
      firstCell.startsWith('обсяг') ||
      firstCell.startsWith('итого') ||
      firstCell.startsWith('total')
    ) {
      const numericCells = row
        .map((c) => parseBrokerNumber(c))
        .filter((n, idx) => idx > 0 && n !== 0);

      if (numericCells.length >= 2) {
        expectedTotals = {
          margin: numericCells[0],
          grossReturn: numericCells[1],
          pnl: numericCells[2] !== undefined ? numericCells[2] : numericCells[1],
        };
      }
      // Stop reading further trades
      break;
    }

    // Check if row has at least an instrument or dealId
    const instrument = (row[columnIndices.instrument] || '').trim();
    if (!instrument) {
      continue;
    }

    const dealId = (row[columnIndices.dealId] || '').trim();
    const directionStr = row[columnIndices.direction] || 'Купити';
    const openedAtStr = columnIndices.openedAt !== undefined ? row[columnIndices.openedAt] : '';
    const openDateStr = columnIndices.openDate !== undefined ? row[columnIndices.openDate] : '';
    const openTimeStr = columnIndices.openTime !== undefined ? row[columnIndices.openTime] : '';

    const closedAtStr = columnIndices.closedAt !== undefined ? row[columnIndices.closedAt] : '';
    const closeDateStr = columnIndices.closeDate !== undefined ? row[columnIndices.closeDate] : '';
    const closeTimeStr = columnIndices.closeTime !== undefined ? row[columnIndices.closeTime] : '';

    const tradeDateStr = columnIndices.tradeDate !== undefined ? row[columnIndices.tradeDate] : '';
    const baseDate = tradeDateStr || metadata.reportDate || '';

    const openPrice = parseBrokerNumber(row[columnIndices.openPrice]);
    const closePrice = parseBrokerNumber(row[columnIndices.closePrice]);
    const margin = parseBrokerNumber(row[columnIndices.margin]);
    const leverage = parseBrokerNumber(row[columnIndices.leverage]);
    const grossReturn = parseBrokerNumber(row[columnIndices.grossReturn]);
    const pnl = parseBrokerNumber(row[columnIndices.pnl]);

    // Parse closedAt first (often has full date/time in reports)
    let closedAt = combineDateAndTime(
      closedAtStr || closeDateStr || tradeDateStr,
      closeTimeStr,
      baseDate
    );

    // Parse openedAt using baseDate or closedAt as date reference for time-only fields
    let openedAt = combineDateAndTime(
      openedAtStr || openDateStr || tradeDateStr,
      openTimeStr,
      baseDate || closedAt
    );

    // If closedAt was time-only and missed baseDate, retry with openedAt
    if (!closedAt && (closedAtStr || closeTimeStr) && openedAt) {
      closedAt = combineDateAndTime(closedAtStr || closeDateStr, closeTimeStr, openedAt);
    }
    // If openedAt was time-only and missed baseDate, retry with closedAt
    if (!openedAt && (openedAtStr || openTimeStr) && closedAt) {
      openedAt = combineDateAndTime(openedAtStr || openDateStr, openTimeStr, closedAt);
    }

    // If one date is available and the other is not, mirror it
    if (!openedAt && closedAt) {
      openedAt = closedAt;
    } else if (!closedAt && openedAt) {
      closedAt = openedAt;
    } else if (!openedAt && !closedAt) {
      // If neither date was found in the row, check reportDate from header metadata
      const reportDateParsed = metadata.reportDate ? parseBrokerDate(metadata.reportDate) : '';
      if (reportDateParsed) {
        openedAt = reportDateParsed;
        closedAt = reportDateParsed;
      }
    }

    const trade: Trade = {
      id: dealId || `trade-${Date.now()}-${trades.length + 1}`,
      dealId: dealId || undefined,
      instrument,
      direction: parseDirection(directionStr),
      openedAt,
      closedAt,
      openPrice,
      closePrice,
      margin,
      leverage: leverage || 1,
      grossReturn,
      pnl,
    };

    trades.push(trade);
  }

  // 3. Checksum verification against footer
  let checksumPassed = true;
  if (expectedTotals && expectedTotals.pnl !== undefined) {
    const computedPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const diff = Math.abs(computedPnl - expectedTotals.pnl);
    if (diff > 0.05) {
      checksumPassed = false;
      warnings.push(
        `Footer P&L (${expectedTotals.pnl}) does not match computed sum of trades (${computedPnl.toFixed(2)})`
      );
    }
  }

  return {
    trades,
    metadata,
    expectedTotals,
    checksumPassed,
    errors,
    warnings,
  };
}
