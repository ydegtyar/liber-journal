import { describe, it, expect } from 'vitest';
import { formatToYMD, getDefault3MonthsRange } from '../../lib/dateUtils';

describe('TimeframeHeaderBanner date calculations', () => {
  it('formats date to YYYY-MM-DD correctly', () => {
    const testDate = new Date(2026, 4, 15); // May 15, 2026
    expect(formatToYMD(testDate)).toBe('2026-05-15');

    const testDatePadded = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatToYMD(testDatePadded)).toBe('2026-01-05');
  });

  it('calculates default 3 months range ending today', () => {
    const { startDate, endDate } = getDefault3MonthsRange();

    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const start = new Date(startDate);
    const end = new Date(endDate);
    expect(end.getTime()).toBeGreaterThan(start.getTime());

    // Difference in days should be roughly 89-93 days (3 months)
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBeGreaterThanOrEqual(88);
    expect(diffDays).toBeLessThanOrEqual(93);
  });
});
