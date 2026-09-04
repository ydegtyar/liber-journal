import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { generateXlsxWorkbook, getColumnLetter, getTradeMonthKey } from './xlsxTemplate';
import { DEFAULT_JOURNAL_SETTINGS } from '../types/preferences';
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

  it('generates a valid XLSX in English with monthly sheet (September 2026) and Daily P&L at start (Col C)', async () => {
    const blob = await generateXlsxWorkbook(sampleTrades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit: 10000,
    }, 'en');
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

    // Check header stats card in English
    expect(journalSheet.getCell('A1').value).toBe('Account Summary');
    expect(journalSheet.getCell('B2').value).toBe(10000);
    expect((journalSheet.getCell('B3').value as { formula: string }).formula).toBe('=B2+B5');

    // Check Monthly Summary block in English
    expect(journalSheet.getCell('E1').value).toBe('Monthly Summary');
    expect(journalSheet.getCell('E2').value).toBe('Monthly P&L');
    expect(journalSheet.getCell('E3').value).toBe('Monthly Orders');
    expect((journalSheet.getCell('F2').value as { formula: string }).formula).toBe('=SUM(C12:C13)');
    expect((journalSheet.getCell('F3').value as { formula: string }).formula).toBe('=SUM(B12:B13)');
    expect(journalSheet.getCell('E4').value).toContain('Explanation:');

    // Check Weekly Summary block in English
    expect(journalSheet.getCell('I1').value).toBe('Weekly Summary');
    expect(journalSheet.getCell('I2').value).toBe('Week');
    expect(journalSheet.getCell('J2').value).toBe('Dates');
    expect(journalSheet.getCell('K2').value).toBe('Orders/Week');
    expect(journalSheet.getCell('L2').value).toBe('P&L/Week');

    // Check Daily Matrix headers: Date (A), Orders (B), Daily P&L (C), Trades (D..)
    expect(journalSheet.getCell('A11').value).toBe('Date');
    expect(journalSheet.getCell('B11').value).toBe('Orders');
    expect(journalSheet.getCell('C11').value).toBe('Daily P&L');
    expect(journalSheet.getCell('D11').value).toBe(1); // Trade 1
    expect(journalSheet.getCell('E11').value).toBe(2); // Trade 2

    // Check row 12 (01.09.2026: 1 trade)
    expect(journalSheet.getCell('A12').value).toBe('01.09.2026');
    expect((journalSheet.getCell('B12').value as { formula: string }).formula).toBe('=COUNT(D12:R12)');
    expect((journalSheet.getCell('C12').value as { formula: string }).formula).toBe('=SUM(D12:R12)');
    expect(journalSheet.getCell('D12').value).toBe(-0.21);

    // Check row 13 (02.09.2026: 2 trades in chronological order: 2 and 3.01)
    expect(journalSheet.getCell('A13').value).toBe('02.09.2026');
    expect((journalSheet.getCell('B13').value as { formula: string }).formula).toBe('=COUNT(D13:R13)');
    expect((journalSheet.getCell('C13').value as { formula: string }).formula).toBe('=SUM(D13:R13)');
    expect(journalSheet.getCell('D13').value).toBe(2);
    expect(journalSheet.getCell('E13').value).toBe(3.01);

    // Check Totals row
    expect(journalSheet.getCell('A14').value).toBe('Total');
    expect((journalSheet.getCell('B14').value as { formula: string }).formula).toBe('=SUM(B12:B13)');
    expect((journalSheet.getCell('C14').value as { formula: string }).formula).toBe('=SUM(C12:C13)');

    // Check Sheet 2 headers in English
    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.getRow(1).getCell(1).value).toBe('Deal ID');
    expect(tradesSheet.getRow(1).getCell(2).value).toBe('Instrument');

    // Check Sheet 3 titles & metrics in English
    const analyticsSheet = workbook.getWorksheet('Analytics')!;
    expect(analyticsSheet.getCell('A1').value).toBe('Trading Account Performance Analytics');
    expect(analyticsSheet.getCell('A3').value).toBe('Current Account Balance');
    expect(analyticsSheet.getCell('A4').value).toBe('Net Profit / Loss');
  });

  it('puts each month on a separate sheet for multi-month trades', async () => {
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
      ...sampleTrades, // September trades
    ];

    const blob = await generateXlsxWorkbook(multiMonthTrades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit: 5000,
    }, 'en');

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toEqual(['August 2026', 'September 2026', 'Trades', 'Analytics']);

    const augSheet = workbook.getWorksheet('August 2026')!;
    expect(augSheet.getCell('B2').value).toBe(5000); // Initial deposit in month 1

    const sepSheet = workbook.getWorksheet('September 2026')!;
    // In month 2, starting deposit links to month 1 ending deposit
    expect((sepSheet.getCell('B2').value as { formula: string }).formula).toBe("='August 2026'!B3");

    // Master Trades sheet contains all 4 trades
    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.rowCount).toBe(5); // 1 header + 4 trades
  });

  it('generates a valid XLSX in Ukrainian when uk locale is selected', async () => {
    const blob = await generateXlsxWorkbook(sampleTrades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit: 10000,
    }, 'uk');

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toContain('Вересень 2026');

    const journalSheet = workbook.getWorksheet('Вересень 2026')!;
    expect(journalSheet.getCell('A1').value).toBe('Статистика рахунку');
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
  });

  it('generates a valid XLSX in Russian when ru locale is selected', async () => {
    const blob = await generateXlsxWorkbook(sampleTrades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit: 10000,
    }, 'ru');

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toContain('Сентябрь 2026');

    const journalSheet = workbook.getWorksheet('Сентябрь 2026')!;
    expect(journalSheet.getCell('A1').value).toBe('Статистика счета');
    expect(journalSheet.getCell('E1').value).toBe('За месяц');
    expect(journalSheet.getCell('A11').value).toBe('Дата');
    expect(journalSheet.getCell('B11').value).toBe('Закрыто сделок');
    expect(journalSheet.getCell('C11').value).toBe('Прибыль $');
    expect(journalSheet.getCell('A14').value).toBe('Всего');

    const tradesSheet = workbook.getWorksheet('Trades')!;
    expect(tradesSheet.getRow(1).getCell(1).value).toBe('ID сделки');
    expect(tradesSheet.getRow(1).getCell(2).value).toBe('Инструмент');

    const analyticsSheet = workbook.getWorksheet('Analytics')!;
    expect(analyticsSheet.getCell('A1').value).toBe('Аналитика эффективности торгового счета');
    expect(analyticsSheet.getCell('A3').value).toBe('Текущий баланс счета');
    expect(analyticsSheet.getCell('A4').value).toBe('Чистая прибыль / убыток');
  });
});
