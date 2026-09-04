import ExcelJS from 'exceljs';
import { Trade } from '../types/trade';
import { JournalSettings } from '../types/preferences';

/**
 * Generates an Excel (.xlsx) workbook with live dynamic formulas,
 * named ranges, styled tables, and formatted cells.
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

  // ----------------------------------------------------
  // Sheet 1: Executive Summary & Performance Dashboard
  // ----------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: true }],
  });

  // Styling helpers
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF161B22' },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const boldFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
  };

  const regularFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE1E4E8' } },
    bottom: { style: 'thin', color: { argb: 'FFE1E4E8' } },
    left: { style: 'thin', color: { argb: 'FFE1E4E8' } },
    right: { style: 'thin', color: { argb: 'FFE1E4E8' } },
  };

  // Configure column widths
  summarySheet.columns = [
    { width: 28 }, // Col A: Metric / Date
    { width: 20 }, // Col B: Value / Trades
    { width: 18 }, // Col C: Net PnL
    { width: 18 }, // Col D: Win Rate
    { width: 18 }, // Col E: Profit Factor
  ];

  // Title
  summarySheet.mergeCells('A1:B1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'Trading Account Performance Summary';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF0969DA' } };

  // Setup Initial Deposit cell & global Named Range
  summarySheet.getCell('A3').value = 'Initial Deposit';
  summarySheet.getCell('A3').font = boldFont;
  const depositCell = summarySheet.getCell('B3');
  depositCell.value = settings.initialDeposit;
  depositCell.numFmt = '$#,##0.00';
  depositCell.font = boldFont;

  // Add Defined Name for InitialDeposit
  workbook.definedNames.add('Summary!$B$3', 'InitialDeposit');

  // Performance Metrics Table
  const metrics = [
    { label: 'Current Account Balance', formula: '=InitialDeposit + SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 4 },
    { label: 'Net Profit / Loss', formula: '=SUM(Trades!K:K)', numFmt: '$#,##0.00', row: 5 },
    { label: 'Total Return (ROI %)', formula: '=(B5 / InitialDeposit) * 100', numFmt: '0.00"%"', row: 6 },
    { label: 'Total Closed Trades', formula: '=COUNTA(Trades!K2:K50000)', numFmt: '#,##0', row: 7 },
    { label: 'Winning Trades', formula: '=COUNTIF(Trades!K:K, ">0")', numFmt: '#,##0', row: 8 },
    { label: 'Losing Trades', formula: '=COUNTIF(Trades!K:K, "<0")', numFmt: '#,##0', row: 9 },
    { label: 'Breakeven (BE) Trades', formula: '=COUNTIF(Trades!K2:K50000, "=0")', numFmt: '#,##0', row: 10 },
    {
      label: 'Win Rate % (Excl. BE)',
      formula: '=IF((B8+B9)=0, 0, (B8 / (B8+B9)) * 100)',
      numFmt: '0.0"%"',
      row: 11,
    },
    { label: 'Gross Profit', formula: '=SUMIF(Trades!K:K, ">0")', numFmt: '$#,##0.00', row: 12 },
    { label: 'Gross Loss', formula: '=ABS(SUMIF(Trades!K:K, "<0"))', numFmt: '$#,##0.00', row: 13 },
    {
      label: 'Profit Factor',
      formula: '=IF(B13=0, "N/A", B12 / B13)',
      numFmt: '0.00',
      row: 14,
    },
    {
      label: 'Average Win',
      formula: '=IF(B8=0, 0, B12 / B8)',
      numFmt: '$#,##0.00',
      row: 15,
    },
    {
      label: 'Average Loss',
      formula: '=IF(B9=0, 0, B13 / B9)',
      numFmt: '$#,##0.00',
      row: 16,
    },
  ];

  for (const m of metrics) {
    const lblCell = summarySheet.getCell(`A${m.row}`);
    lblCell.value = m.label;
    lblCell.font = regularFont;
    lblCell.border = thinBorder;

    const valCell = summarySheet.getCell(`B${m.row}`);
    valCell.value = { formula: m.formula.replace('Trades!', 'Trades!') };
    valCell.font = boldFont;
    valCell.numFmt = m.numFmt;
    valCell.border = thinBorder;
  }

  // ----------------------------------------------------
  // Sheet 2: Trades Detailed Ledger
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

  // Format header row
  const headerRow = tradesSheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Populate data rows
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

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
