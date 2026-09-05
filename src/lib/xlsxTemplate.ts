import ExcelJS from 'exceljs';
import { Trade } from '../types/trade';
import {
  DEFAULT_MATRIX_COLUMN_ORDER,
  JournalSettings,
  Locale,
  MatrixColumnBlockId,
} from '../types/preferences';
import { formatMonthSheetName, getXlsxTranslations } from './xlsxTranslations';
import { formatDisplayDate, getTradeDateKey, getTradeMonthKey } from './dateUtils';
import { JOURNAL_LOGO_PNG_BASE64 } from './journalLogo';

export { getTradeDateKey, getTradeMonthKey, formatDisplayDate };

const TRADING_JOURNAL_APP_URL =
  typeof window !== 'undefined' &&
  window.location?.origin &&
  !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://liber-journal.vercel.app';

/**
 * Converts 1-based column index to Excel column letter (1 -> A, 27 -> AA, etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Ensures all cells within a merged bounding box have borders applied.
 */
function applyRangeBorder(
  worksheet: ExcelJS.Worksheet,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  border: Partial<ExcelJS.Borders>
): void {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      worksheet.getCell(r, c).border = border;
    }
  }
}

/**
 * Ensures all cells within a merged bounding box have fill applied.
 */
function applyRangeFill(
  worksheet: ExcelJS.Worksheet,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  fill: ExcelJS.Fill
): void {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      worksheet.getCell(r, c).fill = fill;
    }
  }
}

/**
 * Returns ISO week identifier (e.g. "2026-W35")
 */
function getWeekKey(isoString: string): { weekKey: string; weekNumber: number; year: number } {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { weekKey: 'Unknown', weekNumber: 0, year: 2026 };

  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = target.getFullYear();
  return { weekKey: `${year}-W${String(weekNumber).padStart(2, '0')}`, weekNumber, year };
}

/**
 * Generates an Excel (.xlsx) workbook where each month is placed on a separate sheet,
 * followed by the master Trades ledger and institutional Analytics summary.
 * Each monthly sheet contains its own Daily Matrix, Monthly & Weekly P&L cards,
 * user-friendly pastel styling, and dynamic formulas.
 */
export async function generateXlsxWorkbook(
  trades: Trade[],
  settings: JournalSettings,
  locale: Locale = 'en'
): Promise<Blob> {
  const t = getXlsxTranslations(locale);
  const appUrl = TRADING_JOURNAL_APP_URL;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Trading Journal Web Terminal';
  workbook.lastModifiedBy = 'Trading Journal';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Register brand logo image
  const logoImageId = workbook.addImage({
    base64: JOURNAL_LOGO_PNG_BASE64,
    extension: 'png',
  });

  // ----------------------------------------------------
  // User-Friendly Pastel Styling Definitions
  // ----------------------------------------------------
  const pastelIndigoFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEF2FF' }, // Soft Indigo / Periwinkle (Account Summary & Analytics header)
  };

  const pastelMintFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' }, // Soft Mint / Emerald (Monthly Summary header)
  };

  const pastelAmberFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFBEB' }, // Soft Amber / Warm Sand (Weekly Summary header)
  };

  const pastelSkyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F2FE' }, // Soft Sky / Ice Blue (Daily P&L Header)
  };

  const pastelSlateFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' }, // Soft Slate (Table Headers: Matrix, Trades, Totals)
  };

  const pastelSubtleSlateFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }, // Light Slate (Order columns headers & Weekly headers)
  };

  const lightCardBgFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }, // Light neutral fill for labels and helper cells
  };

  const winGreenFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDCFCE7' }, // Soft Pastel Mint Green (Profitable trades & positive totals)
  };

  const lossRedFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEE2E2' }, // Soft Pastel Rose Red (Losing trades)
  };

  // Typography definitions
  const sectionTitleIndigoFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FF312E81' },
  };

  const sectionTitleMintFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FF065F46' },
  };

  const sectionTitleAmberFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FF92400E' },
  };

  const tableHeaderFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FF1E293B' },
  };

  const tableHeaderSkyFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FF0369A1' },
  };

  const cardLabelFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    color: { argb: 'FF475569' },
  };

  const boldFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FF0F172A' },
  };

  const regularFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    color: { argb: 'FF1E293B' },
  };

  const explanationFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 9,
    italic: true,
    color: { argb: 'FF64748B' },
  };

  // Borders definitions
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  const totalsBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'double', color: { argb: 'FF475569' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // Sort all trades chronologically ascending
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
  });

  // Group trades by month (YYYY-MM)
  const monthGroups: Record<string, Trade[]> = {};
  for (const tr of sortedTrades) {
    const monthKey = getTradeMonthKey(tr.closedAt);
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = [];
    }
    monthGroups[monthKey].push(tr);
  }

  let sortedMonthKeys = Object.keys(monthGroups)
    .filter((k) => k !== 'Unknown')
    .sort();

  // If no trades exist, create a single worksheet for the current month
  if (sortedMonthKeys.length === 0) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const nowKey = `${curYear}-${curMonth}`;
    sortedMonthKeys = [nowKey];
    monthGroups[nowKey] = [];
  }

  // Pre-calculate monthly net PnL and deposit progression across all months
  let runningDeposit = settings.initialDeposit;
  const monthStats: Record<
    string,
    {
      startDeposit: number;
      monthNetPnl: number;
      endDeposit: number;
      totalNetPnl: number;
      totalRoiPct: number;
    }
  > = {};

  sortedMonthKeys.forEach((monthKey) => {
    const mTrades = monthGroups[monthKey] || [];
    const rawMonthPnl = mTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const roundedMonthPnl = Math.round(rawMonthPnl * 100) / 100;
    const startDeposit = runningDeposit;
    const endDeposit = Math.round((startDeposit + roundedMonthPnl) * 100) / 100;
    runningDeposit = endDeposit;
    const totalNetPnl = Math.round((endDeposit - settings.initialDeposit) * 100) / 100;
    const totalRoiPct =
      settings.initialDeposit > 0 ? (totalNetPnl / settings.initialDeposit) * 100 : 0;

    monthStats[monthKey] = {
      startDeposit,
      monthNetPnl: roundedMonthPnl,
      endDeposit,
      totalNetPnl,
      totalRoiPct: Math.round(totalRoiPct * 100) / 100,
    };
  });

  const firstMonthSheetName = formatMonthSheetName(sortedMonthKeys[0], locale);

  // ----------------------------------------------------------------------
  // MONTHLY SHEETS (Each Month on a Separate Sheet)
  // Sheets are added in reverse-chronological order so the latest month is
  // the first (active) sheet when the XLSX file is opened. Business logic
  // (InitialDeposit, cross-month balance chain, Total P&L formula) still uses
  // the chronological index (mIdx) derived from sortedMonthKeys.
  // ----------------------------------------------------------------------
  [...sortedMonthKeys].reverse().forEach((monthKey) => {
    const mIdx = sortedMonthKeys.indexOf(monthKey);
    const monthTrades = monthGroups[monthKey] || [];
    const sheetName = formatMonthSheetName(monthKey, locale);
    const stats = monthStats[monthKey];

    const journalSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 11, xSplit: 1 }],
    });

    // 1. Group trades within this month by closed date and week
    const dayGroups: Record<string, Trade[]> = {};
    const weekGroups: Record<string, { weekNumber: number; dateRange: string; days: string[] }> =
      {};

    for (const tr of monthTrades) {
      const dateKey = getTradeDateKey(tr.closedAt);
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = [];
      }
      dayGroups[dateKey].push(tr);

      const { weekKey, weekNumber } = getWeekKey(tr.closedAt);
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          weekNumber,
          dateRange: formatDisplayDate(dateKey),
          days: [],
        };
      }
      if (!weekGroups[weekKey].days.includes(dateKey)) {
        weekGroups[weekKey].days.push(dateKey);
        const firstDay = formatDisplayDate(weekGroups[weekKey].days[0]);
        const lastDay = formatDisplayDate(
          weekGroups[weekKey].days[weekGroups[weekKey].days.length - 1]
        );
        weekGroups[weekKey].dateRange = `${firstDay} - ${lastDay}`;
      }
    }

    const sortedDateKeys = Object.keys(dayGroups).sort();
    const maxTradesInDay =
      sortedDateKeys.length > 0 ? Math.max(...sortedDateKeys.map((k) => dayGroups[k].length)) : 10;
    // Provide at least 15 order columns for scalable quick entry
    const orderColumnsCount = Math.max(maxTradesInDay, 15);

    // Determine column block order (default or user-configured from IndexedDB)
    const columnOrder: MatrixColumnBlockId[] =
      settings.matrixColumnOrder && settings.matrixColumnOrder.length === 4
        ? settings.matrixColumnOrder
        : DEFAULT_MATRIX_COLUMN_ORDER;

    let dateColIndex = 1;
    let ordersColIndex = 2;
    let dailyPnlColIndex = 3;
    let firstTradeColIndex = 4;
    let lastTradeColIndex = 4 + orderColumnsCount - 1;

    let colCursor = 1;
    for (const blockId of columnOrder) {
      if (blockId === 'date') {
        dateColIndex = colCursor;
        colCursor += 1;
      } else if (blockId === 'ordersCount') {
        ordersColIndex = colCursor;
        colCursor += 1;
      } else if (blockId === 'dailyPnl') {
        dailyPnlColIndex = colCursor;
        colCursor += 1;
      } else if (blockId === 'orders') {
        firstTradeColIndex = colCursor;
        lastTradeColIndex = colCursor + orderColumnsCount - 1;
        colCursor += orderColumnsCount;
      }
    }

    const ordersColLetter = getColumnLetter(ordersColIndex);
    const dailyPnlColLetter = getColumnLetter(dailyPnlColIndex);
    const firstTradeColLetter = getColumnLetter(firstTradeColIndex);
    const lastTradeColLetter = getColumnLetter(lastTradeColIndex);

    // --- Top Summary Card Block: Account Summary (A1:B5) ---
    journalSheet.mergeCells('A1:B1');
    applyRangeFill(journalSheet, 1, 1, 2, 1, pastelIndigoFill);
    applyRangeBorder(journalSheet, 1, 1, 2, 1, thinBorder);
    const titleA1 = journalSheet.getCell('A1');
    titleA1.value = t.accountSummaryTitle;
    titleA1.font = sectionTitleIndigoFont;
    titleA1.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Initial Deposit
    const cellA2 = journalSheet.getCell('A2');
    cellA2.value = t.initialDepositLabel(mIdx === 0 ? settings.depositAsOf : undefined);
    cellA2.font = cardLabelFont;
    cellA2.fill = lightCardBgFill;
    cellA2.border = thinBorder;

    const depCell = journalSheet.getCell('B2');
    if (mIdx === 0) {
      depCell.value = settings.initialDeposit;
      workbook.definedNames.add(`'${sheetName}'!$B$2`, 'InitialDeposit');
    } else {
      const prevSheetName = formatMonthSheetName(sortedMonthKeys[mIdx - 1], locale);
      depCell.value = {
        formula: `='${prevSheetName}'!B3`,
        result: stats.startDeposit,
      };
    }
    depCell.font = boldFont;
    depCell.numFmt = '$#,##0.00';
    depCell.border = thinBorder;

    // Row 3: Current Deposit (sum of initial deposit + monthly pnl)
    const cellA3 = journalSheet.getCell('A3');
    cellA3.value = t.currentDepositLabel;
    cellA3.font = cardLabelFont;
    cellA3.fill = lightCardBgFill;
    cellA3.border = thinBorder;

    const currDepCell = journalSheet.getCell('B3');
    currDepCell.value = {
      formula: '=B2+F2',
      result: stats.endDeposit,
    };
    currDepCell.font = boldFont;
    currDepCell.numFmt = '$#,##0.00';
    currDepCell.border = thinBorder;

    // Row 4: Total Return % (Total P&L / account's original deposit)
    const cellA4 = journalSheet.getCell('A4');
    cellA4.value = t.returnPctLabel;
    cellA4.font = cardLabelFont;
    cellA4.fill = lightCardBgFill;
    cellA4.border = thinBorder;

    const roiCell = journalSheet.getCell('B4');
    if (mIdx === 0) {
      roiCell.value = {
        formula: '=IF(B2=0,0,B5/B2)',
        result: stats.totalRoiPct / 100,
      };
    } else {
      roiCell.value = {
        formula: `=IF('${firstMonthSheetName}'!B2=0,0,B5/'${firstMonthSheetName}'!B2)`,
        result: stats.totalRoiPct / 100,
      };
    }
    roiCell.font = boldFont;
    roiCell.numFmt = '0.00%';
    roiCell.border = thinBorder;

    // Row 5: Total P&L (Current Deposit - account's original deposit)
    const cellA5 = journalSheet.getCell('A5');
    cellA5.value = t.totalPnlLabel;
    cellA5.font = cardLabelFont;
    cellA5.fill = lightCardBgFill;
    cellA5.border = thinBorder;

    const totalPnlCell = journalSheet.getCell('B5');
    if (mIdx === 0) {
      totalPnlCell.value = {
        formula: '=B3-B2',
        result: stats.totalNetPnl,
      };
    } else {
      totalPnlCell.value = {
        formula: `=B3-'${firstMonthSheetName}'!B2`,
        result: stats.totalNetPnl,
      };
    }
    totalPnlCell.font = boldFont;
    totalPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    totalPnlCell.border = thinBorder;

    // --- Top Brand Badge Block (C1:D1) - Minimal institutional badge with Web App Link ---
    journalSheet.getRow(1).height = 24;
    journalSheet.mergeCells('C1:D1');
    applyRangeFill(journalSheet, 3, 1, 4, 1, lightCardBgFill);
    applyRangeBorder(journalSheet, 3, 1, 4, 1, thinBorder);
    const brandCell = journalSheet.getCell('C1');
    brandCell.value = {
      text: t.appTitle,
      hyperlink: appUrl,
      tooltip: t.appLinkTooltip,
    };
    brandCell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FF1D4ED8' },
      underline: true,
    };
    brandCell.alignment = { vertical: 'middle', horizontal: 'center' };
    journalSheet.addImage(logoImageId, {
      tl: { col: 2.15, row: 0.1 },
      ext: { width: 20, height: 20 },
    });

    // --- Monthly Summary Block (E1:G5) ---
    journalSheet.mergeCells('E1:G1');
    applyRangeFill(journalSheet, 5, 1, 7, 1, pastelMintFill);
    applyRangeBorder(journalSheet, 5, 1, 7, 1, thinBorder);
    const monthHeaderCell = journalSheet.getCell('E1');
    monthHeaderCell.value = t.monthlySummaryTitle;
    monthHeaderCell.font = sectionTitleMintFont;
    monthHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Monthly P&L
    const cellE2 = journalSheet.getCell('E2');
    cellE2.value = t.monthlyPnlLabel;
    cellE2.font = cardLabelFont;
    cellE2.fill = lightCardBgFill;
    cellE2.border = thinBorder;

    journalSheet.mergeCells('F2:G2');
    applyRangeBorder(journalSheet, 6, 2, 7, 2, thinBorder);
    const monthPnlCell = journalSheet.getCell('F2');
    monthPnlCell.font = boldFont;
    monthPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    monthPnlCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Row 3: Monthly Orders Count
    const cellE3 = journalSheet.getCell('E3');
    cellE3.value = t.monthlyOrdersLabel;
    cellE3.font = cardLabelFont;
    cellE3.fill = lightCardBgFill;
    cellE3.border = thinBorder;

    journalSheet.mergeCells('F3:G3');
    applyRangeBorder(journalSheet, 6, 3, 7, 3, thinBorder);
    const monthOrdersCell = journalSheet.getCell('F3');
    monthOrdersCell.font = boldFont;
    monthOrdersCell.numFmt = '#,##0';
    monthOrdersCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Rows 4-5: Monthly explanation block
    journalSheet.mergeCells('E4:G5');
    applyRangeFill(journalSheet, 5, 4, 7, 5, lightCardBgFill);
    applyRangeBorder(journalSheet, 5, 4, 7, 5, thinBorder);
    const monthExpCell = journalSheet.getCell('E4');
    monthExpCell.value = t.monthlyExplanation;
    monthExpCell.font = explanationFont;
    monthExpCell.alignment = { wrapText: true, vertical: 'top' };

    // --- Weekly Summary Block (I1:L6) ---
    journalSheet.mergeCells('I1:L1');
    applyRangeFill(journalSheet, 9, 1, 12, 1, pastelAmberFill);
    applyRangeBorder(journalSheet, 9, 1, 12, 1, thinBorder);
    const weekHeaderCell = journalSheet.getCell('I1');
    weekHeaderCell.value = t.weeklySummaryTitle;
    weekHeaderCell.font = sectionTitleAmberFont;
    weekHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const weekCols = ['I', 'J', 'K', 'L'];
    t.weeklyHeaders.forEach((wh, idx) => {
      const cell = journalSheet.getCell(`${weekCols[idx]}2`);
      cell.value = wh;
      cell.fill = pastelSubtleSlateFill;
      cell.font = tableHeaderFont;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Calculate row indexes for the Daily Matrix
    const matrixHeaderRowNumber = 11;
    const firstDataRowNumber = 12;
    const dataRowCount = sortedDateKeys.length > 0 ? sortedDateKeys.length : 1;
    const lastDataRowNumber = firstDataRowNumber + dataRowCount - 1;
    const totalsRowNumber = lastDataRowNumber + 1;

    // Connect Monthly Summary formulas dynamically to all daily PnLs
    monthPnlCell.value = {
      formula: `=SUM(${dailyPnlColLetter}${firstDataRowNumber}:${dailyPnlColLetter}${lastDataRowNumber})`,
      result: stats.monthNetPnl,
    };
    monthOrdersCell.value = {
      formula: `=SUM(${ordersColLetter}${firstDataRowNumber}:${ordersColLetter}${lastDataRowNumber})`,
      result: monthTrades.length,
    };

    // Populate Weekly Summary Rows
    const sortedWeekKeys = Object.keys(weekGroups).sort();
    let currentWeekRow = 3;

    for (const wk of sortedWeekKeys) {
      const wInfo = weekGroups[wk];
      const wDays = wInfo.days;

      // Find row indexes for this week's days in the matrix
      const dayRowIndexes = wDays
        .map((d) => firstDataRowNumber + sortedDateKeys.indexOf(d))
        .filter((idx) => idx >= firstDataRowNumber);

      const wRow = currentWeekRow;
      const cellWk = journalSheet.getCell(`I${wRow}`);
      cellWk.value = t.weekLabel(wInfo.weekNumber);
      cellWk.font = boldFont;
      cellWk.border = thinBorder;

      const cellRange = journalSheet.getCell(`J${wRow}`);
      cellRange.value = wInfo.dateRange;
      cellRange.font = regularFont;
      cellRange.border = thinBorder;

      if (dayRowIndexes.length > 0) {
        const minRow = Math.min(...dayRowIndexes);
        const maxRow = Math.max(...dayRowIndexes);

        const weekOrders = wDays.reduce((acc, d) => acc + (dayGroups[d]?.length || 0), 0);
        const weekPnl =
          Math.round(
            wDays.reduce((acc, d) => {
              return acc + (dayGroups[d]?.reduce((sum, tr) => sum + tr.pnl, 0) || 0);
            }, 0) * 100
          ) / 100;

        const ordersCell = journalSheet.getCell(`K${wRow}`);
        ordersCell.value = {
          formula: `=SUM(${ordersColLetter}${minRow}:${ordersColLetter}${maxRow})`,
          result: weekOrders,
        };
        ordersCell.font = boldFont;
        ordersCell.numFmt = '#,##0';
        ordersCell.border = thinBorder;
        ordersCell.alignment = { horizontal: 'center' };

        const pnlCell = journalSheet.getCell(`L${wRow}`);
        pnlCell.value = {
          formula: `=SUM(${dailyPnlColLetter}${minRow}:${dailyPnlColLetter}${maxRow})`,
          result: weekPnl,
        };
        pnlCell.font = boldFont;
        pnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
        pnlCell.border = thinBorder;
        pnlCell.alignment = { horizontal: 'right' };
      }

      currentWeekRow++;
    }

    // Weekly explanation cell below weekly table
    const weekExpStartRow = Math.max(currentWeekRow, 6);
    journalSheet.mergeCells(`I${weekExpStartRow}:L${weekExpStartRow + 1}`);
    applyRangeFill(journalSheet, 9, weekExpStartRow, 12, weekExpStartRow + 1, lightCardBgFill);
    applyRangeBorder(journalSheet, 9, weekExpStartRow, 12, weekExpStartRow + 1, thinBorder);
    const weekExpCell = journalSheet.getCell(`I${weekExpStartRow}`);
    weekExpCell.value = t.weeklyExplanation;
    weekExpCell.font = explanationFont;
    weekExpCell.alignment = { wrapText: true, vertical: 'top' };

    // --- Daily Order Matrix Table Headers (Row 11) ---
    const headerRow = journalSheet.getRow(matrixHeaderRowNumber);
    headerRow.height = 24;

    for (const blockId of columnOrder) {
      if (blockId === 'date') {
        const cell = journalSheet.getCell(
          `${getColumnLetter(dateColIndex)}${matrixHeaderRowNumber}`
        );
        cell.value = t.matrixDateHeader;
        cell.fill = pastelSlateFill;
        cell.font = tableHeaderFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      } else if (blockId === 'ordersCount') {
        const cell = journalSheet.getCell(
          `${getColumnLetter(ordersColIndex)}${matrixHeaderRowNumber}`
        );
        cell.value = t.matrixOrdersHeader;
        cell.fill = pastelSlateFill;
        cell.font = tableHeaderFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      } else if (blockId === 'dailyPnl') {
        const cell = journalSheet.getCell(
          `${getColumnLetter(dailyPnlColIndex)}${matrixHeaderRowNumber}`
        );
        cell.value = t.matrixDailyPnlHeader;
        cell.fill = pastelSkyFill;
        cell.font = tableHeaderSkyFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      } else if (blockId === 'orders') {
        for (let c = 1; c <= orderColumnsCount; c++) {
          const colIdx = firstTradeColIndex + c - 1;
          const colLetter = getColumnLetter(colIdx);
          const orderHeaderCell = journalSheet.getCell(`${colLetter}${matrixHeaderRowNumber}`);
          orderHeaderCell.value = c;
          orderHeaderCell.fill = pastelSubtleSlateFill;
          orderHeaderCell.font = tableHeaderFont;
          orderHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
          orderHeaderCell.border = thinBorder;
        }
      }
    }

    // --- Populate Daily Order Rows (Row 12 onwards) ---
    if (sortedDateKeys.length === 0) {
      // Empty row placeholder with active formulas
      const emptyRow = journalSheet.getRow(firstDataRowNumber);
      emptyRow.height = 20;

      const emptyDate = emptyRow.getCell(dateColIndex);
      emptyDate.value = t.noTradesLabel;
      emptyDate.font = regularFont;
      emptyDate.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyDate.border = thinBorder;

      const emptyOrders = emptyRow.getCell(ordersColIndex);
      emptyOrders.value = {
        formula: `=COUNT(${firstTradeColLetter}${firstDataRowNumber}:${lastTradeColLetter}${firstDataRowNumber})`,
        result: 0,
      };
      emptyOrders.font = boldFont;
      emptyOrders.numFmt = '#,##0';
      emptyOrders.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyOrders.border = thinBorder;
      emptyOrders.fill = lightCardBgFill;

      const emptyDailyPnl = emptyRow.getCell(dailyPnlColIndex);
      emptyDailyPnl.value = {
        formula: `=SUM(${firstTradeColLetter}${firstDataRowNumber}:${lastTradeColLetter}${firstDataRowNumber})`,
        result: 0,
      };
      emptyDailyPnl.font = boldFont;
      emptyDailyPnl.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
      emptyDailyPnl.alignment = { horizontal: 'right', vertical: 'middle' };
      emptyDailyPnl.border = thinBorder;
      emptyDailyPnl.fill = lightCardBgFill;

      for (let c = 0; c < orderColumnsCount; c++) {
        const cell = emptyRow.getCell(firstTradeColIndex + c);
        cell.border = thinBorder;
        cell.value = null;
      }
    } else {
      sortedDateKeys.forEach((dateKey, index) => {
        const rowNumber = firstDataRowNumber + index;
        const dayTrades = dayGroups[dateKey];
        const dayPnl = Math.round(dayTrades.reduce((acc, tr) => acc + tr.pnl, 0) * 100) / 100;
        const row = journalSheet.getRow(rowNumber);
        row.height = 20;

        // Col A: Date (e.g. 01.09.2026)
        const dateCell = row.getCell(dateColIndex);
        dateCell.value = formatDisplayDate(dateKey);
        dateCell.font = boldFont;
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dateCell.border = thinBorder;

        // Col B: Closed Orders Count (Live Formula: =COUNT(D:lastCol))
        const countCell = row.getCell(ordersColIndex);
        countCell.value = {
          formula: `=COUNT(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
          result: dayTrades.length,
        };
        countCell.font = boldFont;
        countCell.numFmt = '#,##0';
        countCell.alignment = { horizontal: 'center', vertical: 'middle' };
        countCell.border = thinBorder;
        countCell.fill = lightCardBgFill;

        // Col C: Daily Total PnL (Live Formula: =SUM(D:lastCol))
        const dailySumCell = row.getCell(dailyPnlColIndex);
        dailySumCell.value = {
          formula: `=SUM(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
          result: dayPnl,
        };
        dailySumCell.font = boldFont;
        dailySumCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
        dailySumCell.alignment = { horizontal: 'right', vertical: 'middle' };
        dailySumCell.border = thinBorder;
        dailySumCell.fill = lightCardBgFill;

        // Trade PnL Cells (Col D onwards)
        for (let c = 0; c < orderColumnsCount; c++) {
          const colIdx = firstTradeColIndex + c;
          const cell = row.getCell(colIdx);
          cell.border = thinBorder;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };

          if (c < dayTrades.length) {
            const tTrade = dayTrades[c];
            cell.value = tTrade.pnl;
            cell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
            cell.font = {
              name: 'Segoe UI',
              size: 9.5,
              color: {
                argb: tTrade.pnl > 0 ? 'FF15803D' : tTrade.pnl < 0 ? 'FFB91C1C' : 'FF64748B',
              },
              bold: Math.abs(tTrade.pnl) >= 5,
            };
            if (tTrade.pnl < 0) {
              cell.fill = lossRedFill;
            } else if (tTrade.pnl > 0) {
              cell.fill = winGreenFill;
            }
          } else {
            cell.value = null;
          }
        }
      });
    }

    // --- Totals Summary Row at Bottom of Matrix ---
    const totRow = journalSheet.getRow(totalsRowNumber);
    totRow.height = 22;

    const totA = totRow.getCell(dateColIndex);
    totA.value = t.matrixTotalLabel;
    totA.font = tableHeaderFont;
    totA.fill = pastelSlateFill;
    totA.border = totalsBorder;
    totA.alignment = { horizontal: 'center', vertical: 'middle' };

    const totB = totRow.getCell(ordersColIndex);
    totB.value = {
      formula: `=SUM(${ordersColLetter}${firstDataRowNumber}:${ordersColLetter}${lastDataRowNumber})`,
      result: monthTrades.length,
    };
    totB.font = tableHeaderFont;
    totB.fill = pastelSlateFill;
    totB.border = totalsBorder;
    totB.alignment = { horizontal: 'center', vertical: 'middle' };
    totB.numFmt = '#,##0';

    // Grand Total Net P&L (Col C)
    const totDaily = totRow.getCell(dailyPnlColIndex);
    totDaily.value = {
      formula: `=SUM(${dailyPnlColLetter}${firstDataRowNumber}:${dailyPnlColLetter}${lastDataRowNumber})`,
      result: stats.monthNetPnl,
    };
    totDaily.font = {
      ...boldFont,
      color: { argb: stats.monthNetPnl >= 0 ? 'FF15803D' : 'FFB91C1C' },
    };
    totDaily.fill = stats.monthNetPnl >= 0 ? winGreenFill : lossRedFill;
    totDaily.border = totalsBorder;
    totDaily.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    totDaily.alignment = { horizontal: 'right', vertical: 'middle' };

    // Subtotals for each trade order column (Col D onwards)
    for (let c = 0; c < orderColumnsCount; c++) {
      const colIdx = firstTradeColIndex + c;
      const colLetter = getColumnLetter(colIdx);
      const colSum = sortedDateKeys.reduce((acc, d) => {
        const tradesOnDay = dayGroups[d] || [];
        return acc + (tradesOnDay[c]?.pnl || 0);
      }, 0);

      const cell = totRow.getCell(colIdx);
      cell.value = {
        formula: `=SUM(${colLetter}${firstDataRowNumber}:${colLetter}${lastDataRowNumber})`,
        result: Math.round(colSum * 100) / 100,
      };
      cell.font = boldFont;
      cell.fill = lightCardBgFill;
      cell.border = totalsBorder;
      cell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // Set explicit column widths for Monthly Journal
    journalSheet.getColumn(dateColIndex).width = 15; // Date
    journalSheet.getColumn(ordersColIndex).width = 16; // Orders count
    journalSheet.getColumn(dailyPnlColIndex).width = 18; // Daily P&L
    for (let c = 0; c < orderColumnsCount; c++) {
      journalSheet.getColumn(firstTradeColIndex + c).width = 10;
    }

    // Widths for summary columns
    const col3 = journalSheet.getColumn(3);
    const col3Width = col3.width;
    if (typeof col3Width !== 'number' || col3Width < 14) {
      col3.width = 14;
    }
    const col4 = journalSheet.getColumn(4);
    const col4Width = col4.width;
    if (typeof col4Width !== 'number' || col4Width < 12) {
      col4.width = 12;
    }
    journalSheet.getColumn(5).width = 22;
    journalSheet.getColumn(6).width = 18;
    journalSheet.getColumn(7).width = 18;
    journalSheet.getColumn(9).width = 16;
    journalSheet.getColumn(10).width = 18;
    journalSheet.getColumn(11).width = 16;
    journalSheet.getColumn(12).width = 18;
  });

  // ----------------------------------------------------
  // MASTER SHEET: Trades Detailed Ledger (All deals)
  // ----------------------------------------------------
  const tradesSheet = workbook.addWorksheet('Trades', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });

  const tradeColKeys = [
    'dealId',
    'instrument',
    'direction',
    'openedAt',
    'closedAt',
    'openPrice',
    'closePrice',
    'margin',
    'leverage',
    'grossReturn',
    'pnl',
    'tag',
    'note',
  ];
  const tradeColWidths = [22, 18, 12, 20, 20, 14, 14, 14, 12, 16, 16, 14, 28];

  tradesSheet.columns = tradeColKeys.map((key, idx) => ({
    header: t.tradesHeaders[idx] || key,
    key,
    width: tradeColWidths[idx] || 15,
  }));

  const tHeaderRow = tradesSheet.getRow(1);
  tHeaderRow.height = 24;
  tHeaderRow.eachCell((cell) => {
    cell.fill = pastelSlateFill;
    cell.font = tableHeaderFont;
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  sortedTrades.forEach((tr) => {
    const row = tradesSheet.addRow({
      dealId: tr.dealId || tr.id,
      instrument: tr.instrument,
      direction: tr.direction.toUpperCase(),
      openedAt: tr.openedAt ? tr.openedAt.replace('T', ' ').substring(0, 19) : '',
      closedAt: tr.closedAt ? tr.closedAt.replace('T', ' ').substring(0, 19) : '',
      openPrice: tr.openPrice,
      closePrice: tr.closePrice,
      margin: tr.margin,
      leverage: `x${tr.leverage}`,
      grossReturn: tr.grossReturn,
      pnl: tr.pnl,
      tag: tr.tag || '',
      note: tr.note || '',
    });

    row.font = regularFont;
    row.getCell('openPrice').numFmt = '#,##0.0000';
    row.getCell('closePrice').numFmt = '#,##0.0000';
    row.getCell('margin').numFmt = '$#,##0.00';
    row.getCell('grossReturn').numFmt = '$#,##0.00';

    const pnlCell = row.getCell('pnl');
    pnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    pnlCell.font = {
      name: 'Segoe UI',
      bold: true,
      color: { argb: tr.pnl > 0 ? 'FF15803D' : tr.pnl < 0 ? 'FFB91C1C' : 'FF64748B' },
    };

    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  // ----------------------------------------------------
  // MASTER SHEET: Institutional Analytics Summary
  // ----------------------------------------------------
  const analyticsSheet = workbook.addWorksheet('Analytics', {
    views: [{ showGridLines: true }],
  });

  analyticsSheet.columns = [{ width: 28 }, { width: 22 }];

  analyticsSheet.mergeCells('A1:B1');
  applyRangeFill(analyticsSheet, 1, 1, 2, 1, pastelIndigoFill);
  applyRangeBorder(analyticsSheet, 1, 1, 2, 1, thinBorder);
  analyticsSheet.getRow(1).height = 24;
  analyticsSheet.addImage(logoImageId, {
    tl: { col: 0.08, row: 0.1 },
    ext: { width: 20, height: 20 },
  });
  const anTitle = analyticsSheet.getCell('A1');
  anTitle.value = t.analyticsTitle;
  anTitle.font = sectionTitleIndigoFont;
  anTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const metrics = [
    {
      label: t.analyticsMetrics.currentAccountBalance,
      formula: '=InitialDeposit + SUM(Trades!K:K)',
      numFmt: '$#,##0.00',
      row: 3,
    },
    {
      label: t.analyticsMetrics.netProfitLoss,
      formula: '=SUM(Trades!K:K)',
      numFmt: '$#,##0.00',
      row: 4,
    },
    {
      label: t.analyticsMetrics.totalReturnRoi,
      formula: '=(B4 / InitialDeposit) * 100',
      numFmt: '0.00"%"',
      row: 5,
    },
    {
      label: t.analyticsMetrics.totalClosedTrades,
      formula: '=COUNTA(Trades!K2:K50000)',
      numFmt: '#,##0',
      row: 6,
    },
    {
      label: t.analyticsMetrics.winningTrades,
      formula: '=COUNTIF(Trades!K:K, ">0")',
      numFmt: '#,##0',
      row: 7,
    },
    {
      label: t.analyticsMetrics.losingTrades,
      formula: '=COUNTIF(Trades!K:K, "<0")',
      numFmt: '#,##0',
      row: 8,
    },
    {
      label: t.analyticsMetrics.breakevenTrades,
      formula: '=COUNTIF(Trades!K2:K50000, "=0")',
      numFmt: '#,##0',
      row: 9,
    },
    {
      label: t.analyticsMetrics.winRateExclBe,
      formula: '=IF((B7+B8)=0, 0, (B7 / (B7+B8)) * 100)',
      numFmt: '0.0"%"',
      row: 10,
    },
    {
      label: t.analyticsMetrics.grossProfit,
      formula: '=SUMIF(Trades!K:K, ">0")',
      numFmt: '$#,##0.00',
      row: 11,
    },
    {
      label: t.analyticsMetrics.grossLoss,
      formula: '=ABS(SUMIF(Trades!K:K, "<0"))',
      numFmt: '$#,##0.00',
      row: 12,
    },
    {
      label: t.analyticsMetrics.profitFactor,
      formula: '=IF(B12=0, "N/A", B11 / B12)',
      numFmt: '0.00',
      row: 13,
    },
    {
      label: t.analyticsMetrics.averageWin,
      formula: '=IF(B7=0, 0, B11 / B7)',
      numFmt: '$#,##0.00',
      row: 14,
    },
    {
      label: t.analyticsMetrics.averageLoss,
      formula: '=IF(B8=0, 0, B12 / B8)',
      numFmt: '$#,##0.00',
      row: 15,
    },
  ];

  for (const m of metrics) {
    const lblCell = analyticsSheet.getCell(`A${m.row}`);
    lblCell.value = m.label;
    lblCell.font = cardLabelFont;
    lblCell.fill = lightCardBgFill;
    lblCell.border = thinBorder;

    const valCell = analyticsSheet.getCell(`B${m.row}`);
    valCell.value = { formula: m.formula };
    valCell.font = boldFont;
    valCell.numFmt = m.numFmt;
    valCell.border = thinBorder;
  }

  // Row 17: Web Terminal Application Link
  analyticsSheet.mergeCells('A17:B17');
  applyRangeFill(analyticsSheet, 1, 17, 2, 17, lightCardBgFill);
  applyRangeBorder(analyticsSheet, 1, 17, 2, 17, thinBorder);
  analyticsSheet.getRow(17).height = 22;
  const anLinkCell = analyticsSheet.getCell('A17');
  anLinkCell.value = {
    text: `🌐 ${t.webAppTerminalLabel} (${appUrl})`,
    hyperlink: appUrl,
    tooltip: t.appLinkTooltip,
  };
  anLinkCell.font = {
    name: 'Segoe UI',
    size: 9.5,
    bold: true,
    color: { argb: 'FF1D4ED8' },
    underline: true,
  };
  anLinkCell.alignment = { vertical: 'middle', horizontal: 'center' };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
