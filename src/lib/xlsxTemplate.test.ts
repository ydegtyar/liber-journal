import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { generateXlsxWorkbook, getColumnLetter, getTradeMonthKey } from './xlsxTemplate';
import { DEFAULT_JOURNAL_SETTINGS, MatrixColumnBlockId } from '../types/preferences';
import { Trade } from '../types/trade';

describe('XLSX Template Generator', () => {
  const sampleTrades: Trade[] = [
    {
      id: '1',
      dealId: 'EURUSD-144189148',
      instrument: 'EUR/USD',
      direction: 'sell',
      openedAt: '2026-09-01T18:50:00.000Z',
      closedAt: '2026-09-02T07:06:00.000Z',
      openPrice: 1.15885,
      closePrice: 1.15665,
      margin: 30,
      leverage: 55,
      grossReturn: 33.01,
      pnl: 3.01,
    },
    {
      id: '2',
      dealId: 'USDPLN-144163459',
      instrument: 'USD/PLN',
      direction: 'buy',
      openedAt: '2026-09-01T10:15:00.000Z',
      closedAt: '2026-09-01T10:15:00.000Z',
      openPrice: 3.73861,
      closePrice: 3.73822,
      margin: 30,
      leverage: 40,
      grossReturn: 29.79,
      pnl: -0.21,
    },
    {
      id: '3',
      dealId: 'USDCHF-144178635',
      instrument: 'USD/CHF',
      direction: 'buy',
      openedAt: '2026-09-01T15:02:00.000Z',
      closedAt: '2026-09-02T07:05:00.000Z',
      openPrice: 0.81194,
      closePrice: 0.81362,
      margin: 20,
      leverage: 50,
      grossReturn: 22,
      pnl: 2,
    },
  ];

  it('correctly computes Excel column letters', () => {
    expect(getColumnLetter(1)).toBe('A');
    expect(getColumnLetter(2)).toBe('B');
    expect(getColumnLetter(26)).toBe('Z');
    expect(getColumnLetter(27)).toBe('AA');
    expect(getColumnLetter(28)).toBe('AB');
  });

  it('extracts trade month key correctly', () => {
    expect(getTradeMonthKey('2026-09-02T07:06:00.000Z')).toBe('2026-09');
    expect(getTradeMonthKey('2026-12-31T23:59:59.000Z')).toBe('2026-12');
  });

  it('generates a valid XLSX in English with pastel styling and accurate formulas', async () => {
    const blob = await generateXlsxWorkbook(
      sampleTrades,
      {
        ...DEFAULT_JOURNAL_SETTINGS,
        initialDeposit: 10000,
      },
      'en'
    );
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(2000);

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toContain('September 2026');
    expect(sheetNames).toContain('Trades');
    expect(sheetNames).toContain('Analytics');

    const journalSheet = workbook.getWorksheet('September 2026')!;
    expect(journalSheet).toBeDefined();

    // Check Account Summary card in English & pastel colors
    expect(journalSheet.getCell('A1').value).toBe('Account Summary');
    expect((journalSheet.getCell('A1').fill as { fgColor?: { argb?: string } }).fgColor?.argb).toBe(
      'FFEEF2FF'
    );
    expect(journalSheet.getCell('A1').border?.top?.style).toBe('thin');
    expect(journalSheet.getCell('B1').border?.top?.style).toBe('thin');

    // B2: Initial deposit numeric value
    expect(journalSheet.getCell('B2').value).toBe(10000);
    expect(journalSheet.getCell('B2').border?.bottom?.style).toBe('thin');

    // B3: Current deposit formula = B2 + F2
    const b3Cell = journalSheet.getCell('B3');
    expect((b3Cell.value as { formula: string }).formula).toBe('=B2+F2');
    expect((b3Cell.value as { result: number }).result).toBe(10004.8);

    // B4: Total Return % formula = IF(B2=0,0,B5/B2)
    const b4Cell = journalSheet.getCell('B4');
    expect((b4Cell.value as { formula: string }).formula).toBe('=IF(B2=0,0,B5/B2)');
    expect(b4Cell.numFmt).toBe('0.00%');

    // B5: Total P&L formula = B3 - B2
    const b5Cell = journalSheet.getCell('B5');
    expect((b5Cell.value as { formula: string }).formula).toBe('=B3-B2');
    expect((b5Cell.value as { result: number }).result).toBe(4.8);

    // Check Minimal Brand Badge in C1:D1 with embedded logo and Web App hyperlink
    const c1Value = journalSheet.getCell('C1').value as { text: string; hyperlink: string };
    expect(c1Value.text).toBe('Trading Journal');
    expect(c1Value.hyperlink).toBe('https://liber-journal.vercel.app');
    expect((journalSheet.getCell('C1').fill as { fgColor?: { argb?: string } }).fgColor?.argb).toBe(
      'FFF8FAFC'
    );
    expect(journalSheet.getCell('C1').border?.top?.style).toBe('thin');
    expect(journalSheet.getCell('D1').border?.top?.style).toBe('thin');
    expect(journalSheet.getImages().length).toBe(1);

    // Check Monthly Summary block in English & pastel mint colors
    expect(journalSheet.getCell('E1').value).toBe('Monthly Summary');
    expect((journalSheet.getCell('E1').fill as { fgColor?: { argb?: string } }).fgColor?.argb).toBe(
      'FFECFDF5'
    );
    expect(journalSheet.getCell('E2').value).toBe('Monthly P&L');
    expect(journalSheet.getCell('E3').value).toBe('Monthly Orders');

    // F2: Monthly PnL formula = SUM(C12:C13)
    const f2Cell = journalSheet.getCell('F2');
    expect((f2Cell.value as { formula: string }).formula).toBe('=SUM(C12:C13)');
    expect((f2Cell.value as { result: number }).result).toBe(4.8);

    // F3: Monthly Orders formula = SUM(B12:B13)
    const f3Cell = journalSheet.getCell('F3');
    expect((f3Cell.value as { formula: string }).formula).toBe('=SUM(B12:B13)');
    expect((f3Cell.value as { result: number }).result).toBe(3);

    expect(journalSheet.getCell('E4').value).toContain('Explanation:');

    // Check Weekly Summary block in English & pastel amber colors
    expect(journalSheet.getCell('I1').value).toBe('Weekly Summary');
    expect((journalSheet.getCell('I1').fill as { fgColor?: { argb?: string } }).fgColor?.argb).toBe(
      'FFFFFBEB'
    );
    expect(journalSheet.getCell('I2').value).toBe('Week');
    expect(journalSheet.getCell('J2').value).toBe('Dates');
    expect(journalSheet.getCell('K2').value).toBe('Orders/Week');
    expect(journalSheet.getCell('L2').value).toBe('P&L/Week');

    // Check Daily Matrix headers: Date (A), Orders (B), Daily P&L (C), Trades (D..)
    expect(journalSheet.getCell('A11').value).toBe('Date');
    expect(journalSheet.getCell('B11').value).toBe('Orders');
    expect(journalSheet.getCell('C11').value).toBe('Daily P&L');
    expect(
      (journalSheet.getCell('C11').fill as { fgColor?: { argb?: string } }).fgColor?.argb
    ).toBe('FFE0F2FE');
    expect(journalSheet.getCell('D11').value).toBe(1);
    expect(journalSheet.getCell('E11').value).toBe(2);

    // Check row 12 (01.09.2026: 1 trade)
    expect(journalSheet.getCell('A12').value).toBe('01.09.2026');
    const b12 = journalSheet.getCell('B12').value as { formula: string; result: number };
    expect(b12.formula).toBe('=COUNT(D12:R12)');
    expect(b12.result).toBe(1);

    const c12 = journalSheet.getCell('C12').value as { formula: string; result: number };
    expect(c12.formula).toBe('=SUM(D12:R12)');
    expect(c12.result).toBe(-0.21);
    expect(journalSheet.getCell('D12').value).toBe(-0.21);

    // Check row 13 (02.09.2026: 2 trades)
    expect(journalSheet.getCell('A13').value).toBe('02.09.2026');
    const b13 = journalSheet.getCell('B13').value as { formula: string; result: number };
    expect(b13.formula).toBe('=COUNT(D13:R13)');
    expect(b13.result).toBe(2);

    const c13 = journalSheet.getCell('C13').value as { formula: string; result: number };
    expect(c13.formula).toBe('=SUM(D13:R13)');
    expect(c13.result).toBe(5.01);
    expect(journalSheet.getCell('D13').value).toBe(2);
    expect(journalSheet.getCell('E13').value).toBe(3.01);

    // Check Totals row
    expect(journalSheet.getCell('A14').value).toBe('Total');
    const totB = journalSheet.getCell('B14').value as { formula: string; result: number };
    expect(totB.formula).toBe('=SUM(B12:B13)');
    expect(totB.result).toBe(3);

    const totC = journalSheet.getCell('C14').value as { formula: string; result: number };
    expect(totC.formula).toBe('=SUM(C12:C13)');
    expect(totC.result).toBe(4.8);
    expect(journalSheet.getCell('C14').border?.bottom?.style).toBe('double');

    // Check Sheet 2 headers in English & borders
    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.getRow(1).getCell(1).value).toBe('Deal ID');
    expect(tradesSheet.getRow(1).getCell(1).border?.top?.style).toBe('thin');
    expect(
      (tradesSheet.getRow(1).getCell(1).fill as { fgColor?: { argb?: string } }).fgColor?.argb
    ).toBe('FFE2E8F0');

    // Check Sheet 3 titles & metrics in English & pastel styling
    const analyticsSheet = workbook.getWorksheet('Analytics')!;
    expect(analyticsSheet.getCell('A1').value).toBe('Trading Account Performance Analytics');
    expect(
      (analyticsSheet.getCell('A1').fill as { fgColor?: { argb?: string } }).fgColor?.argb
    ).toBe('FFEEF2FF');
    expect(analyticsSheet.getCell('A1').border?.top?.style).toBe('thin');
    expect(analyticsSheet.getCell('B1').border?.top?.style).toBe('thin');
    expect(analyticsSheet.getImages().length).toBe(1);
    expect(analyticsSheet.getCell('A3').value).toBe('Current Account Balance');
    expect(analyticsSheet.getCell('A4').value).toBe('Net Profit / Loss');

    // Check Web Terminal Link in A17
    const a17Value = analyticsSheet.getCell('A17').value as { text: string; hyperlink: string };
    expect(a17Value.text).toContain('Trading Journal Web Terminal');
    expect(a17Value.hyperlink).toBe('https://liber-journal.vercel.app');
  });

  it('puts each month on a separate sheet for multi-month trades and links balances correctly', async () => {
    const multiMonthTrades: Trade[] = [
      {
        id: 'aug-1',
        dealId: 'DEAL-AUG',
        instrument: 'EUR/USD',
        direction: 'buy',
        openedAt: '2026-08-30T10:00:00.000Z',
        closedAt: '2026-08-30T15:00:00.000Z',
        openPrice: 1.1,
        closePrice: 1.11,
        margin: 50,
        leverage: 20,
        grossReturn: 10,
        pnl: 10,
      },
      ...sampleTrades, // September trades (pnl = +4.80)
    ];

    const blob = await generateXlsxWorkbook(
      multiMonthTrades,
      {
        ...DEFAULT_JOURNAL_SETTINGS,
        initialDeposit: 5000,
      },
      'en'
    );

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toEqual(['September 2026', 'August 2026', 'Trades', 'Analytics']);

    const augSheet = workbook.getWorksheet('August 2026')!;
    // Month 1 (earliest month):
    expect(augSheet.getCell('B2').value).toBe(5000); // Initial deposit in month 1
    const augB3 = augSheet.getCell('B3').value as { formula: string; result: number };
    expect(augB3.formula).toBe('=B2+F2');
    expect(augB3.result).toBe(5010);
    const augB5 = augSheet.getCell('B5').value as { formula: string; result: number };
    expect(augB5.formula).toBe('=B3-B2');
    expect(augB5.result).toBe(10);

    const sepSheet = workbook.getWorksheet('September 2026')!;
    // In month 2, starting deposit links to month 1 ending deposit
    const sepB2 = sepSheet.getCell('B2').value as { formula: string; result: number };
    expect(sepB2.formula).toBe("='August 2026'!B3");
    expect(sepB2.result).toBe(5010);

    // In month 2, current deposit = B2 + F2
    const sepB3 = sepSheet.getCell('B3').value as { formula: string; result: number };
    expect(sepB3.formula).toBe('=B2+F2');
    expect(sepB3.result).toBe(5014.8);

    // In month 2, total P&L links to initial deposit on first sheet
    const sepB5 = sepSheet.getCell('B5').value as { formula: string; result: number };
    expect(sepB5.formula).toBe("=B3-'August 2026'!B2");
    expect(sepB5.result).toBe(14.8);

    // In month 2, total Return % formula links to initial deposit on first sheet
    const sepB4 = sepSheet.getCell('B4').value as { formula: string; result: number };
    expect(sepB4.formula).toBe("=IF('August 2026'!B2=0,0,B5/'August 2026'!B2)");

    // Master Trades sheet contains all 4 trades
    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.rowCount).toBe(5); // 1 header + 4 trades
  });

  it('generates a valid XLSX in Ukrainian when uk locale is selected', async () => {
    const blob = await generateXlsxWorkbook(
      sampleTrades,
      {
        ...DEFAULT_JOURNAL_SETTINGS,
        initialDeposit: 10000,
      },
      'uk'
    );

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toContain('Вересень 2026');

    const journalSheet = workbook.getWorksheet('Вересень 2026')!;
    expect(journalSheet.getCell('A1').value).toBe('Статистика рахунку');
    const c1UkValue = journalSheet.getCell('C1').value as { text: string; hyperlink: string };
    expect(c1UkValue.text).toBe('Торговий журнал');
    expect(c1UkValue.hyperlink).toBe('https://liber-journal.vercel.app');
    expect(journalSheet.getImages().length).toBe(1);
    expect(journalSheet.getCell('E1').value).toBe('За місяць');
    expect(journalSheet.getCell('A11').value).toBe('Дата');
    expect(journalSheet.getCell('B11').value).toBe('Закрито угод');
    expect(journalSheet.getCell('C11').value).toBe('Прибуток $');
    expect(journalSheet.getCell('A14').value).toBe('Всього');

    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.getRow(1).getCell(1).value).toBe('ID угоди');
    expect(tradesSheet.getRow(1).getCell(2).value).toBe('Інструмент');

    const analyticsSheet = workbook.getWorksheet('Analytics')!;
    expect(analyticsSheet.getCell('A1').value).toBe('Аналітика ефективності торгового рахунку');
    expect(analyticsSheet.getCell('A3').value).toBe('Поточний баланс рахунку');
    expect(analyticsSheet.getCell('A4').value).toBe('Чистий прибуток / збиток');

    // Check Ukrainian Web Terminal Link in A17
    const a17UkValue = analyticsSheet.getCell('A17').value as { text: string; hyperlink: string };
    expect(a17UkValue.text).toContain('Веб-термінал Торгового журналу');
    expect(a17UkValue.hyperlink).toBe('https://liber-journal.vercel.app');
  });

  it('generates an XLSX respecting custom matrixColumnOrder and updates formulas dynamically', async () => {
    const customOrder: MatrixColumnBlockId[] = ['dailyPnl', 'date', 'orders', 'ordersCount'];
    const blob = await generateXlsxWorkbook(
      sampleTrades,
      {
        ...DEFAULT_JOURNAL_SETTINGS,
        initialDeposit: 10000,
        matrixColumnOrder: customOrder,
      },
      'en'
    );

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const journalSheet = workbook.getWorksheet('September 2026')!;
    expect(journalSheet).toBeDefined();

    // In customOrder:
    // Col 1 (A): Daily P&L (dailyPnl)
    // Col 2 (B): Date (date)
    // Col 3..17 (C..Q): Orders (15 cols)
    // Col 18 (R): Closed Orders Count (ordersCount)
    expect(journalSheet.getCell('A11').value).toBe('Daily P&L');
    expect(journalSheet.getCell('B11').value).toBe('Date');
    expect(journalSheet.getCell('C11').value).toBe(1);
    expect(journalSheet.getCell('R11').value).toBe('Orders');

    // Data Row 12 (01.09.2026):
    // Col A (Daily P&L): formula =SUM(C12:Q12)
    const a12 = journalSheet.getCell('A12').value as { formula: string; result: number };
    expect(a12.formula).toBe('=SUM(C12:Q12)');
    expect(a12.result).toBe(-0.21);

    // Col B (Date): 01.09.2026
    expect(journalSheet.getCell('B12').value).toBe('01.09.2026');

    // Col C (Trade 1): -0.21
    expect(journalSheet.getCell('C12').value).toBe(-0.21);

    // Col R (Orders count): formula =COUNT(C12:Q12)
    const r12 = journalSheet.getCell('R12').value as { formula: string; result: number };
    expect(r12.formula).toBe('=COUNT(C12:Q12)');
    expect(r12.result).toBe(1);

    // Monthly Summary:
    // F2 (Monthly PnL) dynamically sums Col A: =SUM(A12:A13)
    const f2 = journalSheet.getCell('F2').value as { formula: string; result: number };
    expect(f2.formula).toBe('=SUM(A12:A13)');

    // F3 (Monthly Orders) dynamically sums Col R: =SUM(R12:R13)
    const f3 = journalSheet.getCell('F3').value as { formula: string; result: number };
    expect(f3.formula).toBe('=SUM(R12:R13)');
  });
});
