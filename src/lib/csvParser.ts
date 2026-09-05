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
 * Parses date string in format "d/M/yyyy H:mm", "dd.MM.yyyy HH:mm:ss", or ISO string.
 */
function parseBrokerDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const trimmed = dateStr.trim();

  // Try standard ISO or new Date directly first
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime()) && trimmed.includes('-')) {
    return directDate.toISOString();
  }

  // Handle d/M/yyyy H:mm or dd/MM/yyyy HH:mm:ss
  const slashMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(slashMatch[3], 10);
    const hour = slashMatch[4] ? parseInt(slashMatch[4], 10) : 0;
    const minute = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
    const second = slashMatch[6] ? parseInt(slashMatch[6], 10) : 0;

    const parsed = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  // Handle dd.MM.yyyy HH:mm:ss or d.M.yyyy H:mm
  const dotMatch = trimmed.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10) - 1;
    const year = parseInt(dotMatch[3], 10);
    const hour = dotMatch[4] ? parseInt(dotMatch[4], 10) : 0;
    const minute = dotMatch[5] ? parseInt(dotMatch[5], 10) : 0;
    const second = dotMatch[6] ? parseInt(dotMatch[6], 10) : 0;

    const parsed = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
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
    const openedAtStr = row[columnIndices.openedAt] || '';
    const closedAtStr = row[columnIndices.closedAt] || '';
    const openPrice = parseBrokerNumber(row[columnIndices.openPrice]);
    const closePrice = parseBrokerNumber(row[columnIndices.closePrice]);
    const margin = parseBrokerNumber(row[columnIndices.margin]);
    const leverage = parseBrokerNumber(row[columnIndices.leverage]);
    const grossReturn = parseBrokerNumber(row[columnIndices.grossReturn]);
    const pnl = parseBrokerNumber(row[columnIndices.pnl]);

    const trade: Trade = {
      id: dealId || `trade-${Date.now()}-${trades.length + 1}`,
      dealId: dealId || undefined,
      instrument,
      direction: parseDirection(directionStr),
      openedAt: parseBrokerDate(openedAtStr),
      closedAt: parseBrokerDate(closedAtStr),
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
