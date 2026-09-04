import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { generateXlsxWorkbook, getColumnLetter } from './xlsxTemplate';
import { DEFAULT_JOURNAL_SETTINGS } from '../types/preferences';
import { Trade } from '../types/trade';

describe('XLSX Template Generator', () => {
  it('correctly computes Excel column letters', () => {
    expect(getColumnLetter(1)).toBe('A');
    expect(getColumnLetter(2)).toBe('B');
    expect(getColumnLetter(26)).toBe('Z');
    expect(getColumnLetter(27)).toBe('AA');
    expect(getColumnLetter(28)).toBe('AB');
  });

  it('generates a valid XLSX with Daily Order Matrix, Monthly & Weekly P&L and explanations', async () => {
    const trades: Trade[] = [
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

    const blob = await generateXlsxWorkbook(trades, {
      ...DEFAULT_JOURNAL_SETTINGS,
      initialDeposit: 10000,
    });
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(2000);

    // Read workbook back with ExcelJS to inspect sheets and formula cells
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    expect(sheetNames).toContain('Daily Journal');
    expect(sheetNames).toContain('Trades');
    expect(sheetNames).toContain('Analytics');

    const journalSheet = workbook.getWorksheet('Daily Journal')!;
    expect(journalSheet).toBeDefined();

    // Check header stats card
    expect(journalSheet.getCell('B2').value).toBe(10000); // Initial deposit
    expect((journalSheet.getCell('B3').value as { formula: string }).formula).toBe('=B2+B5'); // Current deposit formula

    // Check Monthly Summary block
    expect(journalSheet.getCell('E1').value).toContain('За Місяць / Monthly Summary');
    expect((journalSheet.getCell('F2').value as { formula: string }).formula).toContain('=SUM('); // Monthly P&L formula
    expect(journalSheet.getCell('E4').value).toContain('Пояснення:');

    // Check Weekly Summary block
    expect(journalSheet.getCell('I1').value).toContain('Тижневі підсумки / Weekly Summary');
    expect(journalSheet.getCell('I6').value).toContain('Пояснення:');

    // Check Daily Matrix headers
    expect(journalSheet.getCell('A11').value).toBe('Дата / Date');
    expect(journalSheet.getCell('B11').value).toBe('Закрив угод / Orders');
    expect(journalSheet.getCell('C11').value).toBe(1); // Trade 1
    expect(journalSheet.getCell('D11').value).toBe(2); // Trade 2

    // Check row 12 (01.09.2026: 1 trade)
    expect(journalSheet.getCell('A12').value).toBe('01.09.2026');
    expect((journalSheet.getCell('B12').value as { formula: string }).formula).toBe('=COUNT(C12:Q12)');
    expect(journalSheet.getCell('C12').value).toBe(-0.21);

    // Check row 13 (02.09.2026: 2 trades in chronological order: 2 and 3.01)
    expect(journalSheet.getCell('A13').value).toBe('02.09.2026');
    expect((journalSheet.getCell('B13').value as { formula: string }).formula).toBe('=COUNT(C13:Q13)');
    expect(journalSheet.getCell('C13').value).toBe(2);
    expect(journalSheet.getCell('D13').value).toBe(3.01);
  });
});
