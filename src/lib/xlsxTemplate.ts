import ExcelJS from 'exceljs';
import { Trade } from '../types/trade';
import { JournalSettings } from '../types/preferences';

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
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
 * Generates an Excel (.xlsx) workbook modeled after the daily order matrix
 * with count of orders and pnl per order per day, monthly & weekly PNL cells with explanations,
 * and live dynamic formulas.
 */
export async function generateXlsxWorkbook(
  trades: Trade[],
  settings: JournalSettings
): Promise<Blob> {
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

  // ----------------------------------------------------------------------
  // SHEET 1: Daily Journal (Daily Order Matrix + Monthly & Weekly Summaries)
  // ----------------------------------------------------------------------
  const journalSheet = workbook.addWorksheet('Daily Journal', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 11, xSplit: 2 }],
  });

  // 1. Group trades by closed date
  const dayGroups: Record<string, Trade[]> = {};
  const weekGroups: Record<string, { weekNumber: number; dateRange: string; days: string[] }> = {};

  // Sort trades chronologically ascending
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
  });

  for (const t of sortedTrades) {
    const dateKey = getTradeDateKey(t.closedAt);
    if (!dayGroups[dateKey]) {
      dayGroups[dateKey] = [];
    }
    dayGroups[dateKey].push(t);

    const { weekKey, weekNumber } = getWeekKey(t.closedAt);
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
  // Col 2 (B): Closed Orders Count (formula: =COUNT(C:lastTradeCol))
  // Col 3 .. 3 + orderColumnsCount - 1 (C .. lastTradeCol): Orders 1, 2, 3...
  // Col 3 + orderColumnsCount: Daily PnL (formula: =SUM(C:lastTradeCol))
  const firstTradeColIndex = 3;
  const lastTradeColIndex = firstTradeColIndex + orderColumnsCount - 1;
  const dailyPnlColIndex = lastTradeColIndex + 1;

  const firstTradeColLetter = getColumnLetter(firstTradeColIndex);
  const lastTradeColLetter = getColumnLetter(lastTradeColIndex);
  const dailyPnlColLetter = getColumnLetter(dailyPnlColIndex);

  // --- Top Summary Card Block (Rows 1 to 5) ---
  journalSheet.mergeCells('A1:B1');
  const titleA1 = journalSheet.getCell('A1');
  titleA1.value = 'Статистика рахунку / Account Summary';
  titleA1.fill = darkNavyFill;
  titleA1.font = sectionTitleFont;
  titleA1.alignment = { vertical: 'middle', horizontal: 'center' };

  journalSheet.getCell('A2').value = `Депозит на початок (${settings.depositAsOf || 'Initial'})`;
  journalSheet.getCell('A2').font = regularFont;
  journalSheet.getCell('A2').border = thinBorder;

  const depCell = journalSheet.getCell('B2');
  depCell.value = settings.initialDeposit;
  depCell.font = boldFont;
  depCell.numFmt = '$#,##0.00';
  depCell.border = thinBorder;
  // Define named range for Initial Deposit
  workbook.definedNames.add('\'Daily Journal\'!$B$2', 'InitialDeposit');

  journalSheet.getCell('A3').value = 'Поточний депозит / Current Deposit';
  journalSheet.getCell('A3').font = regularFont;
  journalSheet.getCell('A3').border = thinBorder;

  const currDepCell = journalSheet.getCell('B3');
  currDepCell.value = { formula: '=B2+B5' };
  currDepCell.font = boldFont;
  currDepCell.numFmt = '$#,##0.00';
  currDepCell.border = thinBorder;

  journalSheet.getCell('A4').value = 'Прибуток % / Total Return %';
  journalSheet.getCell('A4').font = regularFont;
  journalSheet.getCell('A4').border = thinBorder;

  const roiCell = journalSheet.getCell('B4');
  roiCell.value = { formula: '=(B5/B2)*100' };
  roiCell.font = boldFont;
  roiCell.numFmt = '0.00"%"';
  roiCell.border = thinBorder;

  journalSheet.getCell('A5').value = 'Сумарний прибуток $ / Total P&L';
  journalSheet.getCell('A5').font = regularFont;
  journalSheet.getCell('A5').border = thinBorder;

  const totalPnlCell = journalSheet.getCell('B5');
  // We will link B5 formula to Monthly Total Net PnL cell once calculated
  totalPnlCell.font = boldFont;
  totalPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
  totalPnlCell.border = thinBorder;

  // --- Monthly & Weekly Summary Blocks (Rows 1 to 6, right side) ---
  // Monthly Block: E1:G5
  journalSheet.mergeCells('E1:G1');
  const monthHeaderCell = journalSheet.getCell('E1');
  monthHeaderCell.value = 'За Місяць / Monthly Summary';
  monthHeaderCell.fill = darkNavyFill;
  monthHeaderCell.font = sectionTitleFont;
  monthHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

  journalSheet.getCell('E2').value = 'Прибуток за місяць / Monthly P&L';
  journalSheet.getCell('E2').font = regularFont;
  journalSheet.getCell('E2').border = thinBorder;

  const monthPnlCell = journalSheet.getCell('F2');
  monthPnlCell.font = boldFont;
  monthPnlCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
  monthPnlCell.border = thinBorder;

  journalSheet.getCell('E3').value = 'Закрито угод / Monthly Orders';
  journalSheet.getCell('E3').font = regularFont;
  journalSheet.getCell('E3').border = thinBorder;

  const monthOrdersCell = journalSheet.getCell('F3');
  monthOrdersCell.font = boldFont;
  monthOrdersCell.numFmt = '#,##0';
  monthOrdersCell.border = thinBorder;

  // Monthly explanation block
  journalSheet.mergeCells('E4:G5');
  const monthExpCell = journalSheet.getCell('E4');
  monthExpCell.value =
    'Пояснення: Загальний чистий прибуток та сумарна кількість закритих угод за період. Формули динамічно підсумовують щоденні результати.\nExplanation: Total net profit and closed order count across the period. Formulas dynamically sum daily results.';
  monthExpCell.font = explanationFont;
  monthExpCell.alignment = { wrapText: true, vertical: 'top' };
  monthExpCell.border = thinBorder;

  // Weekly Block: I1:L6
  journalSheet.mergeCells('I1:L1');
  const weekHeaderCell = journalSheet.getCell('I1');
  weekHeaderCell.value = 'Тижневі підсумки / Weekly Summary';
  weekHeaderCell.fill = darkNavyFill;
  weekHeaderCell.font = sectionTitleFont;
  weekHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

  const weekHeaders = ['Тиждень / Week', 'Діапазон / Dates', 'Угод/Тиждень (Orders)', '$/Тиждень (P&L)'];
  const weekCols = ['I', 'J', 'K', 'L'];
  weekHeaders.forEach((wh, idx) => {
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
  monthOrdersCell.value = { formula: `=SUM(B${firstDataRowNumber}:B${lastDataRowNumber})` };
  totalPnlCell.value = { formula: '=F2' };

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
    journalSheet.getCell(`I${wRow}`).value = `Тиждень ${wInfo.weekNumber}`;
    journalSheet.getCell(`I${wRow}`).font = boldFont;
    journalSheet.getCell(`I${wRow}`).border = thinBorder;

    journalSheet.getCell(`J${wRow}`).value = wInfo.dateRange;
    journalSheet.getCell(`J${wRow}`).font = regularFont;
    journalSheet.getCell(`J${wRow}`).border = thinBorder;

    if (dayRowIndexes.length > 0) {
      const minRow = Math.min(...dayRowIndexes);
      const maxRow = Math.max(...dayRowIndexes);

      const ordersCell = journalSheet.getCell(`K${wRow}`);
      ordersCell.value = { formula: `=SUM(B${minRow}:B${maxRow})` };
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
  weekExpCell.value =
    'Пояснення: Щотижневий P&L показує динаміку прибутковості та торгове навантаження за кожен тиждень для оцінки стабільності стратегії.\nExplanation: Weekly P&L tracks weekly consistency, trading frequency, and profit per week to evaluate system stability.';
  weekExpCell.font = explanationFont;
  weekExpCell.alignment = { wrapText: true, vertical: 'top' };
  weekExpCell.border = thinBorder;

  // --- Daily Order Matrix Table Headers (Row 11) ---
  const headerRow = journalSheet.getRow(matrixHeaderRowNumber);
  headerRow.height = 24;

  // Col A: Дата
  const cellA = journalSheet.getCell(`A${matrixHeaderRowNumber}`);
  cellA.value = 'Дата / Date';
  cellA.fill = slateFill;
  cellA.font = headerFont;
  cellA.alignment = { vertical: 'middle', horizontal: 'center' };
  cellA.border = thinBorder;

  // Col B: Закрив угод
  const cellB = journalSheet.getCell(`B${matrixHeaderRowNumber}`);
  cellB.value = 'Закрив угод / Orders';
  cellB.fill = slateFill;
  cellB.font = headerFont;
  cellB.alignment = { vertical: 'middle', horizontal: 'center' };
  cellB.border = thinBorder;

  // Sequential trade columns: 1, 2, 3, 4, ...
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

  // Rightmost column: Прибуток $
  const cellDailyPnl = journalSheet.getCell(`${dailyPnlColLetter}${matrixHeaderRowNumber}`);
  cellDailyPnl.value = 'Прибуток $ / Daily P&L';
  cellDailyPnl.fill = darkNavyFill;
  cellDailyPnl.font = headerFont;
  cellDailyPnl.alignment = { vertical: 'middle', horizontal: 'center' };
  cellDailyPnl.border = thinBorder;

  // --- Populate Daily Order Rows (Row 12 onwards) ---
  if (sortedDateKeys.length === 0) {
    // Empty row placeholder
    const emptyRow = journalSheet.getRow(firstDataRowNumber);
    emptyRow.getCell(1).value = 'No trades';
    emptyRow.getCell(2).value = 0;
    emptyRow.getCell(dailyPnlColIndex).value = 0;
  } else {
    sortedDateKeys.forEach((dateKey, index) => {
      const rowNumber = firstDataRowNumber + index;
      const dayTrades = dayGroups[dateKey];
      const row = journalSheet.getRow(rowNumber);
      row.height = 20;

      // Col A: Date (e.g. 31.08.2026)
      const dateCell = row.getCell(1);
      dateCell.value = formatDisplayDate(dateKey);
      dateCell.font = boldFont;
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dateCell.border = thinBorder;

      // Col B: Closed Orders Count (Live Formula: =COUNT(C:lastCol))
      const countCell = row.getCell(2);
      countCell.value = {
        formula: `=COUNT(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
      };
      countCell.font = boldFont;
      countCell.numFmt = '#,##0';
      countCell.alignment = { horizontal: 'center', vertical: 'middle' };
      countCell.border = thinBorder;
      countCell.fill = lightGrayFill;

      // Trade PnL Cells (Col C onwards)
      for (let c = 0; c < orderColumnsCount; c++) {
        const colIdx = firstTradeColIndex + c;
        const cell = row.getCell(colIdx);
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };

        if (c < dayTrades.length) {
          const t = dayTrades[c];
          cell.value = t.pnl;
          cell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
          cell.font = {
            name: 'Segoe UI',
            size: 9.5,
            color: { argb: t.pnl > 0 ? 'FF008000' : t.pnl < 0 ? 'FFD32F2F' : 'FF666666' },
            bold: Math.abs(t.pnl) >= 5,
          };
          if (t.pnl < 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
          } else if (t.pnl > 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
          }
        } else {
          // Empty trade slot
          cell.value = null;
        }
      }

      // Daily Total PnL (Live Formula: =SUM(C:lastCol))
      const dailySumCell = row.getCell(dailyPnlColIndex);
      dailySumCell.value = {
        formula: `=SUM(${firstTradeColLetter}${rowNumber}:${lastTradeColLetter}${rowNumber})`,
      };
      dailySumCell.font = boldFont;
      dailySumCell.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
      dailySumCell.alignment = { horizontal: 'right', vertical: 'middle' };
      dailySumCell.border = thinBorder;
      dailySumCell.fill = lightGrayFill;
    });
  }

  // --- Totals Summary Row at Bottom of Matrix ---
  const totRow = journalSheet.getRow(totalsRowNumber);
  totRow.height = 22;

  const totA = totRow.getCell(1);
  totA.value = 'Всього / Total';
  totA.font = boldFont;
  totA.fill = slateFill;
  totA.border = thickBottomBorder;
  totA.alignment = { horizontal: 'center', vertical: 'middle' };
  totA.font = headerFont;

  const totB = totRow.getCell(2);
  totB.value = { formula: `=SUM(B${firstDataRowNumber}:B${lastDataRowNumber})` };
  totB.font = headerFont;
  totB.fill = slateFill;
  totB.border = thickBottomBorder;
  totB.alignment = { horizontal: 'center', vertical: 'middle' };
  totB.numFmt = '#,##0';

  // Subtotals for each trade order column
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

  // Grand Total Net P&L
  const totDaily = totRow.getCell(dailyPnlColIndex);
  totDaily.value = {
    formula: `=SUM(${dailyPnlColLetter}${firstDataRowNumber}:${dailyPnlColLetter}${lastDataRowNumber})`,
  };
  totDaily.font = headerFont;
  totDaily.fill = darkNavyFill;
  totDaily.border = thickBottomBorder;
  totDaily.numFmt = '$#,##0.00;[Red]($#,##0.00);$0.00';
  totDaily.alignment = { horizontal: 'right', vertical: 'middle' };

  // Set explicit column widths for Daily Journal
  journalSheet.getColumn(1).width = 15; // Date
  journalSheet.getColumn(2).width = 16; // Orders count
  for (let c = 0; c < orderColumnsCount; c++) {
    journalSheet.getColumn(firstTradeColIndex + c).width = 10;
  }
  journalSheet.getColumn(dailyPnlColIndex).width = 18; // Daily P&L

  // Widths for summary columns
  journalSheet.getColumn(5).width = 22;
  journalSheet.getColumn(6).width = 18;
  journalSheet.getColumn(7).width = 18;
  journalSheet.getColumn(9).width = 16;
  journalSheet.getColumn(10).width = 18;
  journalSheet.getColumn(11).width = 16;
  journalSheet.getColumn(12).width = 18;

  // ----------------------------------------------------
  // SHEET 2: Trades Detailed Ledger (All CSV raw deals)
  // ----------------------------------------------------
  const tradesSheet = workbook.addWorksheet('Trades', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });

  const columns = [
    { header: 'Deal ID', key: 'dealId', width: 22 },
    { header: 'Instrument', key: 'instrument', width: 18 },
    { header: 'Direction', key: 'direction', width: 12 },
    { header: 'Opened At', key: 'openedAt', width: 20 },
    { header: 'Closed At', key: 'closedAt', width: 20 },
    { header: 'Open Price', key: 'openPrice', width: 14 },
    { header: 'Close Price', key: 'closePrice', width: 14 },
    { header: 'Margin ($)', key: 'margin', width: 14 },
    { header: 'Leverage', key: 'leverage', width: 12 },
    { header: 'Gross Return ($)', key: 'grossReturn', width: 16 },
    { header: 'Net PnL ($)', key: 'pnl', width: 16 },
    { header: 'Tag', key: 'tag', width: 14 },
    { header: 'Notes', key: 'note', width: 28 },
  ];

  tradesSheet.columns = columns;

  const tHeaderRow = tradesSheet.getRow(1);
  tHeaderRow.height = 24;
  tHeaderRow.eachCell((cell) => {
    cell.fill = slateFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  trades.forEach((t) => {
    const row = tradesSheet.addRow({
      dealId: t.dealId || t.id,
      instrument: t.instrument,
      direction: t.direction.toUpperCase(),
      openedAt: t.openedAt ? t.openedAt.replace('T', ' ').substring(0, 19) : '',
      closedAt: t.closedAt ? t.closedAt.replace('T', ' ').substring(0, 19) : '',
      openPrice: t.openPrice,
      closePrice: t.closePrice,
      margin: t.margin,
      leverage: `x${t.leverage}`,
      grossReturn: t.grossReturn,
      pnl: t.pnl,
      tag: t.tag || '',
      note: t.note || '',
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
      color: { argb: t.pnl > 0 ? 'FF008000' : t.pnl < 0 ? 'FFD32F2F' : 'FF666666' },
    };

    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  // ----------------------------------------------------
  // SHEET 3: Institutional Analytics Summary
  // ----------------------------------------------------
  const analyticsSheet = workbook.addWorksheet('Analytics', {
    views: [{ showGridLines: true }],
  });

  analyticsSheet.columns = [{ width: 28 }, { width: 22 }];

  analyticsSheet.mergeCells('A1:B1');
  const anTitle = analyticsSheet.getCell('A1');
  anTitle.value = 'Trading Account Performance Analytics';
  anTitle.fill = darkNavyFill;
  anTitle.font = sectionTitleFont;
  anTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const metrics = [
    { label: 'Current Account Balance', formula: '=InitialDeposit + SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 3 },
    { label: 'Net Profit / Loss', formula: '=SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 4 },
    { label: 'Total Return (ROI %)', formula: '=(B4 / InitialDeposit) * 100', numFmt: '0.00"%"', row: 5 },
    { label: 'Total Closed Trades', formula: '=COUNTA(Trades!K2:K50000)', numFmt: '#,##0', row: 6 },
    { label: 'Winning Trades', formula: '=COUNTIF(Trades!K:K, ">0")', numFmt: '#,##0', row: 7 },
    { label: 'Losing Trades', formula: '=COUNTIF(Trades!K:K, "<0")', numFmt: '#,##0', row: 8 },
    { label: 'Breakeven (BE) Trades', formula: '=COUNTIF(Trades!K2:K50000, "=0")', numFmt: '#,##0', row: 9 },
    {
      label: 'Win Rate % (Excl. BE)',
      formula: '=IF((B7+B8)=0, 0, (B7 / (B7+B8)) * 100)',
      numFmt: '0.0"%"',
      row: 10,
    },
    { label: 'Gross Profit', formula: '=SUMIF(Trades!K:K, ">0")', numFmt: '$#,##0.00', row: 11 },
    { label: 'Gross Loss', formula: '=ABS(SUMIF(Trades!K:K, "<0"))', numFmt: '$#,##0.00', row: 12 },
    {
      label: 'Profit Factor',
      formula: '=IF(B12=0, "N/A", B11 / B12)',
      numFmt: '0.00',
      row: 13,
    },
    {
      label: 'Average Win',
      formula: '=IF(B7=0, 0, B11 / B7)',
      numFmt: '$#,##0.00',
      row: 14,
    },
    {
      label: 'Average Loss',
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
