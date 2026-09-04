import ExcelJS from 'exceljs';
import { Trade } from '../types/trade';
import { JournalSettings, Locale } from '../types/preferences';
import { getXlsxTranslations, formatMonthSheetName } from './xlsxTranslations';

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
 * Each monthly sheet contains its own Daily Matrix (with cumulative daily sum at the start),
 * Monthly & Weekly P&L cards with explanations, and live dynamic formulas.
 */
export async function generateXlsxWorkbook(
  trades: Trade[],
  settings: JournalSettings,
  locale: Locale = 'en'
): Promise<Blob> {
  const t = getXlsxTranslations(locale);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Trading Journal Web Terminal';
  workbook.lastModifiedBy = 'Trading Journal';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color & font styling definitions
  const darkNavyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0D1117' },
  };

  const slateFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF161B22' },
  };

  const lightGrayFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF6F8FA' },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const sectionTitleFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const boldFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
  };

  const regularFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
  };

  const explanationFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 9,
    italic: true,
    color: { argb: 'FF57606A' },
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    right: { style: 'thin', color: { argb: 'FFD0D7DE' } },
  };

  const thickBottomBorder: Partial<ExcelJS.Borders> = {
    ...thinBorder,
    bottom: { style: 'medium', color: { argb: 'FF161B22' } },
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

  // ----------------------------------------------------------------------
  // MONTHLY SHEETS (Each Month on a Separate Sheet)
  // ----------------------------------------------------------------------
  sortedMonthKeys.forEach((monthKey, mIdx) => {
    const monthTrades = monthGroups[monthKey] || [];
    const sheetName = formatMonthSheetName(monthKey, locale);

    const journalSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 11, xSplit: 3 }],
    });

    // 1. Group trades within this month by closed date and week
    const dayGroups: Record<string, Trade[]> = {};
    const weekGroups: Record<string, { weekNumber: number; dateRange: string; days: string[] }> = {};

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
        const lastDay = formatDisplayDate(weekGroups[weekKey].days[weekGroups[weekKey].days.length - 1]);
        weekGroups[weekKey].dateRange = `${firstDay} - ${lastDay}`;
      }
    }

    const sortedDateKeys = Object.keys(dayGroups).sort();
    const maxTradesInDay = sortedDateKeys.length > 0
      ? Math.max(...sortedDateKeys.map((k) => dayGroups[k].length))
      : 10;
    // Provide at least 15 order columns for scalable quick entry
    const orderColumnsCount = Math.max(maxTradesInDay, 15);

    // Column mapping for the Daily Matrix:
    // Col 1 (A): Date
    // Col 2 (B): Closed Orders Count (formula: =COUNT(D:lastTradeCol))
    // Col 3 (C): Daily PnL / Cumulative Daily Sum (formula: =SUM(D:lastTradeCol))
    // Col 4 .. 4 + orderColumnsCount - 1 (D .. lastTradeCol): Orders 1, 2, 3...
    const dateColIndex = 1;
    const ordersColIndex = 2;
    const dailyPnlColIndex = 3;
    const firstTradeColIndex = 4;
    const lastTradeColIndex = firstTradeColIndex + orderColumnsCount - 1;

    const ordersColLetter = getColumnLetter(ordersColIndex);
    const dailyPnlColLetter = getColumnLetter(dailyPnlColIndex);
    const firstTradeColLetter = getColumnLetter(firstTradeColIndex);
    const lastTradeColLetter = getColumnLetter(lastTradeColIndex);

    // --- Top Summary Card Block (Rows 1 to 5) ---
    journalSheet.mergeCells('A1:B1');
    const titleA1 = journalSheet.getCell('A1');
    titleA1.value = t.accountSummaryTitle;
    titleA1.fill = darkNavyFill;
    titleA1.font = sectionTitleFont;
    titleA1.alignment = { vertical: 'middle', horizontal: 'center' };

    journalSheet.getCell('A2').value = t.initialDepositLabel(settings.depositAsOf);
    journalSheet.getCell('A2').font = regularFont;
    journalSheet.getCell('A2').border = thinBorder;

    const depCell = journalSheet.getCell('B2');
    if (mIdx === 0) {
      depCell.value = settings.initialDeposit;
      // Define named range for Initial Deposit referencing first month sheet
      workbook.definedNames.add(`'${sheetName}'!$B$2`, 'InitialDeposit');
    } else {
      const prevSheetName = formatMonthSheetName(sortedMonthKeys[mIdx - 1], locale);
      depCell.value = { formula: `='${prevSheetName}'!B3` };
    }
    depCell.font = boldFont;
    depCell.numFmt = '$#,##0.00';
    depCell.border = thinBorder;

    journalSheet.getCell('A3').value = t.currentDepositLabel;
    journalSheet.getCell('A3').font = regularFont;
    journalSheet.getCell('A3').border = thinBorder;

    const currDepCell = journalSheet.getCell('B3');
    currDepCell.value = { formula: '=B2+B5' };
    currDepCell.font = boldFont;
    currDepCell.numFmt = '$#,##0.00';
    currDepCell.border = thinBorder;

    journalSheet.getCell('A4').value = t.returnPctLabel;
    journalSheet.getCell('A4').font = regularFont;
    journalSheet.getCell('A4').border = thinBorder;

    const roiCell = journalSheet.getCell('B4');
    roiCell.value = { formula: '=(B5/B2)*100' };
    roiCell.font = boldFont;
    roiCell.numFmt = '0.00"%"';
    roiCell.border = thinBorder;

    journalSheet.getCell('A5').value = t.totalPnlLabel;
    journalSheet.getCell('A5').font = regularFont;
    journalSheet.getCell('A5').border = thinBorder;

    const totalPnlCell = journalSheet.getCell('B5');
    totalPnlCell.value = { formula: '=F2' };
    totalPnlCell.font = boldFont;
    totalPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    totalPnlCell.border = thinBorder;

    // --- Monthly & Weekly Summary Blocks (Rows 1 to 6, right side) ---
    // Monthly Block: E1:G5
    journalSheet.mergeCells('E1:G1');
    const monthHeaderCell = journalSheet.getCell('E1');
    monthHeaderCell.value = t.monthlySummaryTitle;
    monthHeaderCell.fill = darkNavyFill;
    monthHeaderCell.font = sectionTitleFont;
    monthHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

    journalSheet.getCell('E2').value = t.monthlyPnlLabel;
    journalSheet.getCell('E2').font = regularFont;
    journalSheet.getCell('E2').border = thinBorder;

    const monthPnlCell = journalSheet.getCell('F2');
    monthPnlCell.font = boldFont;
    monthPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    monthPnlCell.border = thinBorder;

    journalSheet.getCell('E3').value = t.monthlyOrdersLabel;
    journalSheet.getCell('E3').font = regularFont;
    journalSheet.getCell('E3').border = thinBorder;

    const monthOrdersCell = journalSheet.getCell('F3');
    monthOrdersCell.font = boldFont;
    monthOrdersCell.numFmt = '#,##0';
    monthOrdersCell.border = thinBorder;

    // Monthly explanation block
    journalSheet.mergeCells('E4:G5');
    const monthExpCell = journalSheet.getCell('E4');
    monthExpCell.value = t.monthlyExplanation;
    monthExpCell.font = explanationFont;
    monthExpCell.alignment = { wrapText: true, vertical: 'top' };
    monthExpCell.border = thinBorder;

    // Weekly Block: I1:L6
    journalSheet.mergeCells('I1:L1');
    const weekHeaderCell = journalSheet.getCell('I1');
    weekHeaderCell.value = t.weeklySummaryTitle;
    weekHeaderCell.fill = darkNavyFill;
    weekHeaderCell.font = sectionTitleFont;
    weekHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const weekCols = ['I', 'J', 'K', 'L'];
    t.weeklyHeaders.forEach((wh, idx) => {
      const cell = journalSheet.getCell(`${weekCols[idx]}2`);
      cell.value = wh;
      cell.fill = slateFill;
      cell.font = headerFont;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Calculate row indexes for the Daily Matrix
    const matrixHeaderRowNumber = 11;
    const firstDataRowNumber = 12;
    const dataRowCount = sortedDateKeys.length > 0 ? sortedDateKeys.length : 1;
    const lastDataRowNumber = firstDataRowNumber + dataRowCount - 1;
    const totalsRowNumber = lastDataRowNumber + 1;

    // Link Monthly Summary formulas to the matrix
    monthPnlCell.value = { formula: `=SUM(${dailyPnlColLetter}${firstDataRowNumber}:${dailyPnlColLetter}${lastDataRowNumber})` };
    monthOrdersCell.value = { formula: `=SUM(${ordersColLetter}${firstDataRowNumber}:${ordersColLetter}${lastDataRowNumber})` };

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
      journalSheet.getCell(`I${wRow}`).value = t.weekLabel(wInfo.weekNumber);
      journalSheet.getCell(`I${wRow}`).font = boldFont;
      journalSheet.getCell(`I${wRow}`).border = thinBorder;

      journalSheet.getCell(`J${wRow}`).value = wInfo.dateRange;
      journalSheet.getCell(`J${wRow}`).font = regularFont;
      journalSheet.getCell(`J${wRow}`).border = thinBorder;

      if (dayRowIndexes.length > 0) {
        const minRow = Math.min(...dayRowIndexes);
        const maxRow = Math.max(...dayRowIndexes);

        const ordersCell = journalSheet.getCell(`K${wRow}`);
        ordersCell.value = { formula: `=SUM(${ordersColLetter}${minRow}:${ordersColLetter}${maxRow})` };
        ordersCell.font = boldFont;
        ordersCell.numFmt = '#,##0';
        ordersCell.border = thinBorder;
        ordersCell.alignment = { horizontal: 'center' };

        const pnlCell = journalSheet.getCell(`L${wRow}`);
        pnlCell.value = { formula: `=SUM(${dailyPnlColLetter}${minRow}:${dailyPnlColLetter}${maxRow})` };
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
    const weekExpCell = journalSheet.getCell(`I${weekExpStartRow}`);
    weekExpCell.value = t.weeklyExplanation;
    weekExpCell.font = explanationFont;
    weekExpCell.alignment = { wrapText: true, vertical: 'top' };
    weekExpCell.border = thinBorder;

    // --- Daily Order Matrix Table Headers (Row 11) ---
    const headerRow = journalSheet.getRow(matrixHeaderRowNumber);
    headerRow.height = 24;

    // Col A: Date
    const cellA = journalSheet.getCell(`A${matrixHeaderRowNumber}`);
    cellA.value = t.matrixDateHeader;
    cellA.fill = slateFill;
    cellA.font = headerFont;
    cellA.alignment = { vertical: 'middle', horizontal: 'center' };
    cellA.border = thinBorder;

    // Col B: Closed Orders
    const cellB = journalSheet.getCell(`B${matrixHeaderRowNumber}`);
    cellB.value = t.matrixOrdersHeader;
    cellB.fill = slateFill;
    cellB.font = headerFont;
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };
    cellB.border = thinBorder;

    // Col C: Daily P&L / Cumulative Daily Sum (placed at start instead of end)
    const cellDailyPnl = journalSheet.getCell(`C${matrixHeaderRowNumber}`);
    cellDailyPnl.value = t.matrixDailyPnlHeader;
    cellDailyPnl.fill = darkNavyFill;
    cellDailyPnl.font = headerFont;
    cellDailyPnl.alignment = { vertical: 'middle', horizontal: 'center' };
    cellDailyPnl.border = thinBorder;

    // Col D onwards: Sequential trade columns: 1, 2, 3, 4, ...
    for (let c = 1; c <= orderColumnsCount; c++) {
      const colIdx = firstTradeColIndex + c - 1;
      const colLetter = getColumnLetter(colIdx);
      const orderHeaderCell = journalSheet.getCell(`${colLetter}${matrixHeaderRowNumber}`);
      orderHeaderCell.value = c;
      orderHeaderCell.fill = slateFill;
      orderHeaderCell.font = headerFont;
      orderHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
      orderHeaderCell.border = thinBorder;
    }

    // --- Populate Daily Order Rows (Row 12 onwards) ---
    if (sortedDateKeys.length === 0) {
      // Empty row placeholder
      const emptyRow = journalSheet.getRow(firstDataRowNumber);
      emptyRow.getCell(dateColIndex).value = t.noTradesLabel;
      emptyRow.getCell(ordersColIndex).value = 0;
      emptyRow.getCell(dailyPnlColIndex).value = 0;
    } else {
      sortedDateKeys.forEach((dateKey, index) => {
        const rowNumber = firstDataRowNumber + index;
        const dayTrades = dayGroups[dateKey];
        const row = journalSheet.getRow(rowNumber);
        row.height = 20;

        // Col A: Date (e.g. 31.08.2026)
        const dateCell = row.getCell(dateColIndex);
        dateCell.value = formatDisplayDate(dateKey);
        dateCell.font = boldFont;
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dateCell.border = thinBorder;

        // Col B: Closed Orders Count (Live Formula: =COUNT(D:lastCol))
        const countCell = row.getCell(ordersColIndex);
        countCell.value = {
          formula: `=COUNT(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
        };
        countCell.font = boldFont;
        countCell.numFmt = '#,##0';
        countCell.alignment = { horizontal: 'center', vertical: 'middle' };
        countCell.border = thinBorder;
        countCell.fill = lightGrayFill;

        // Col C: Daily Total PnL (Live Formula: =SUM(D:lastCol))
        const dailySumCell = row.getCell(dailyPnlColIndex);
        dailySumCell.value = {
          formula: `=SUM(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
        };
        dailySumCell.font = boldFont;
        dailySumCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
        dailySumCell.alignment = { horizontal: 'right', vertical: 'middle' };
        dailySumCell.border = thinBorder;
        dailySumCell.fill = lightGrayFill;

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
              color: { argb: tTrade.pnl > 0 ? 'FF008000' : tTrade.pnl < 0 ? 'FFD32F2F' : 'FF666666' },
              bold: Math.abs(tTrade.pnl) >= 5,
            };
            if (tTrade.pnl < 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            } else if (tTrade.pnl > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            }
          } else {
            // Empty trade slot
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
    totA.font = headerFont;
    totA.fill = slateFill;
    totA.border = thickBottomBorder;
    totA.alignment = { horizontal: 'center', vertical: 'middle' };

    const totB = totRow.getCell(ordersColIndex);
    totB.value = { formula: `=SUM(${ordersColLetter}${firstDataRowNumber}:${ordersColLetter}${lastDataRowNumber})` };
    totB.font = headerFont;
    totB.fill = slateFill;
    totB.border = thickBottomBorder;
    totB.alignment = { horizontal: 'center', vertical: 'middle' };
    totB.numFmt = '#,##0';

    // Grand Total Net P&L (Col C)
    const totDaily = totRow.getCell(dailyPnlColIndex);
    totDaily.value = {
      formula: `=SUM(${dailyPnlColLetter}${firstDataRowNumber}:${dailyPnlColLetter}${lastDataRowNumber})`,
    };
    totDaily.font = headerFont;
    totDaily.fill = darkNavyFill;
    totDaily.border = thickBottomBorder;
    totDaily.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
    totDaily.alignment = { horizontal: 'right', vertical: 'middle' };

    // Subtotals for each trade order column (Col D onwards)
    for (let c = 0; c < orderColumnsCount; c++) {
      const colIdx = firstTradeColIndex + c;
      const colLetter = getColumnLetter(colIdx);
      const cell = totRow.getCell(colIdx);
      cell.value = { formula: `=SUM(${colLetter}${firstDataRowNumber}:${colLetter}${lastDataRowNumber})` };
      cell.font = boldFont;
      cell.fill = lightGrayFill;
      cell.border = thickBottomBorder;
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

  const columns = tradeColKeys.map((key, idx) => ({
    header: t.tradesHeaders[idx] || key,
    key,
    width: tradeColWidths[idx] || 15,
  }));

  tradesSheet.columns = columns;

  const tHeaderRow = tradesSheet.getRow(1);
  tHeaderRow.height = 24;
  tHeaderRow.eachCell((cell) => {
    cell.fill = slateFill;
    cell.font = headerFont;
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
      color: { argb: tr.pnl > 0 ? 'FF008000' : tr.pnl < 0 ? 'FFD32F2F' : 'FF666666' },
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
  const anTitle = analyticsSheet.getCell('A1');
  anTitle.value = t.analyticsTitle;
  anTitle.fill = darkNavyFill;
  anTitle.font = sectionTitleFont;
  anTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const metrics = [
    { label: t.analyticsMetrics.currentAccountBalance, formula: '=InitialDeposit + SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 3 },
    { label: t.analyticsMetrics.netProfitLoss, formula: '=SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 4 },
    { label: t.analyticsMetrics.totalReturnRoi, formula: '=(B4 / InitialDeposit) * 100', numFmt: '0.00"%"', row: 5 },
    { label: t.analyticsMetrics.totalClosedTrades, formula: '=COUNTA(Trades!K2:K50000)', numFmt: '#,##0', row: 6 },
    { label: t.analyticsMetrics.winningTrades, formula: '=COUNTIF(Trades!K:K, ">0")', numFmt: '#,##0', row: 7 },
    { label: t.analyticsMetrics.losingTrades, formula: '=COUNTIF(Trades!K:K, "<0")', numFmt: '#,##0', row: 8 },
    { label: t.analyticsMetrics.breakevenTrades, formula: '=COUNTIF(Trades!K2:K50000, "=0")', numFmt: '#,##0', row: 9 },
    {
      label: t.analyticsMetrics.winRateExclBe,
      formula: '=IF((B7+B8)=0, 0, (B7 / (B7+B8)) * 100)',
      numFmt: '0.0"%"',
      row: 10,
    },
    { label: t.analyticsMetrics.grossProfit, formula: '=SUMIF(Trades!K:K, ">0")', numFmt: '$#,##0.00', row: 11 },
    { label: t.analyticsMetrics.grossLoss, formula: '=ABS(SUMIF(Trades!K:K, "<0"))', numFmt: '$#,##0.00', row: 12 },
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
    lblCell.font = regularFont;
    lblCell.border = thinBorder;

    const valCell = analyticsSheet.getCell(`B${m.row}`);
    valCell.value = { formula: m.formula };
    valCell.font = boldFont;
    valCell.numFmt = m.numFmt;
    valCell.border = thinBorder;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
