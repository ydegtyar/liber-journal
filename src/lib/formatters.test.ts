import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDuration,
  formatDetailedDuration,
  formatDurationMs,
  formatDetailedDurationMs,
} from './formatters';

describe('formatDuration and formatDetailedDuration', () => {
  it('returns "-" for invalid or missing inputs', () => {
    expect(formatDuration(undefined, undefined)).toBe('-');
    expect(formatDuration('2026-09-01T10:00:00Z', null)).toBe('-');
    expect(formatDuration(null, '2026-09-01T10:00:00Z')).toBe('-');
    expect(formatDuration('invalid-date', '2026-09-01T10:00:00Z')).toBe('-');
    expect(formatDuration('2026-09-01T12:00:00Z', '2026-09-01T10:00:00Z')).toBe('-');

    expect(formatDetailedDuration(undefined, undefined)).toBe('-');
    expect(formatDetailedDuration('invalid', '2026-09-01T10:00:00Z')).toBe('-');
    expect(formatDetailedDuration('2026-09-01T12:00:00Z', '2026-09-01T10:00:00Z')).toBe('-');

    expect(formatDurationMs(undefined)).toBe('-');
    expect(formatDurationMs(null)).toBe('-');
    expect(formatDurationMs(NaN)).toBe('-');
    expect(formatDurationMs(-1000)).toBe('-');

    expect(formatDetailedDurationMs(undefined)).toBe('-');
    expect(formatDetailedDurationMs(null)).toBe('-');
    expect(formatDetailedDurationMs(NaN)).toBe('-');
    expect(formatDetailedDurationMs(-1000)).toBe('-');
  });

  it('formats seconds correctly', () => {
    const start = '2026-09-01T10:00:00.000Z';
    const end0 = '2026-09-01T10:00:00.000Z';
    const end35 = '2026-09-01T10:00:35.000Z';

    expect(formatDuration(start, end0)).toBe('0s');
    expect(formatDetailedDuration(start, end0)).toBe('0s');

    expect(formatDuration(start, end35)).toBe('35s');
    expect(formatDetailedDuration(start, end35)).toBe('35s');
  });

  it('formats minutes and seconds correctly', () => {
    const start = '2026-09-01T10:00:00.000Z';
    const endExactMinutes = '2026-09-01T10:15:00.000Z';
    const endMinutesAndSecs = '2026-09-01T10:15:42.000Z';

    expect(formatDuration(start, endExactMinutes)).toBe('15m');
    expect(formatDetailedDuration(start, endExactMinutes)).toBe('15m');

    expect(formatDuration(start, endMinutesAndSecs)).toBe('15m 42s');
    expect(formatDetailedDuration(start, endMinutesAndSecs)).toBe('15m 42s');
  });

  it('formats hours and minutes correctly', () => {
    const start = '2026-09-01T10:00:00.000Z';
    const endExactHours = '2026-09-01T13:00:00.000Z';
    const endHoursAndMins = '2026-09-01T13:25:00.000Z';
    const endWithSecs = '2026-09-01T13:25:10.000Z';

    expect(formatDuration(start, endExactHours)).toBe('3h');
    expect(formatDetailedDuration(start, endExactHours)).toBe('3h');

    expect(formatDuration(start, endHoursAndMins)).toBe('3h 25m');
    expect(formatDetailedDuration(start, endHoursAndMins)).toBe('3h 25m');

    expect(formatDuration(start, endWithSecs)).toBe('3h 25m');
    expect(formatDetailedDuration(start, endWithSecs)).toBe('3h 25m 10s');
  });

  it('formats days correctly', () => {
    const start = '2026-09-01T10:00:00.000Z';
    const endDaysOnly = '2026-09-03T10:00:00.000Z';
    const endDaysAndHours = '2026-09-03T14:30:15.000Z';

    expect(formatDuration(start, endDaysOnly)).toBe('2d');
    expect(formatDetailedDuration(start, endDaysOnly)).toBe('2d');

    expect(formatDuration(start, endDaysAndHours)).toBe('2d 4h');
    expect(formatDetailedDuration(start, endDaysAndHours)).toBe('2d 4h 30m 15s');
  });

  it('formats ms directly using formatDurationMs and formatDetailedDurationMs', () => {
    expect(formatDurationMs(0)).toBe('0s');
    expect(formatDurationMs(45000)).toBe('45s');
    expect(formatDurationMs(900000)).toBe('15m');
    expect(formatDurationMs(4500000)).toBe('1h 15m');
    expect(formatDurationMs(2 * 86400 * 1000 + 4 * 3600 * 1000)).toBe('2d 4h');

    expect(formatDetailedDurationMs(0)).toBe('0s');
    expect(formatDetailedDurationMs(45000)).toBe('45s');
    expect(formatDetailedDurationMs(900000)).toBe('15m');
    expect(formatDetailedDurationMs(4500000)).toBe('1h 15m');
    expect(
      formatDetailedDurationMs(2 * 86400 * 1000 + 4 * 3600 * 1000 + 30 * 60 * 1000 + 15 * 1000)
    ).toBe('2d 4h 30m 15s');
  });

  it('formats localized durations for Ukrainian locale', () => {
    expect(formatDurationMs(0, 'uk')).toBe('0с');
    expect(formatDurationMs(45000, 'uk-UA')).toBe('45с');
    expect(formatDurationMs(900000, 'uk')).toBe('15хв');
    expect(formatDurationMs(4500000, 'uk')).toBe('1год 15хв');
    expect(formatDurationMs(2 * 86400 * 1000 + 4 * 3600 * 1000, 'uk')).toBe('2д 4год');

    expect(formatDetailedDurationMs(0, 'uk')).toBe('0с');
    expect(formatDetailedDurationMs(45000, 'uk')).toBe('45с');
    expect(formatDetailedDurationMs(900000, 'uk')).toBe('15хв');
    expect(formatDetailedDurationMs(4500000, 'uk')).toBe('1год 15хв');
    expect(
      formatDetailedDurationMs(
        2 * 86400 * 1000 + 4 * 3600 * 1000 + 30 * 60 * 1000 + 15 * 1000,
        'uk'
      )
    ).toBe('2д 4год 30хв 15с');

    const start = '2026-09-01T10:00:00.000Z';
    const end = '2026-09-03T14:30:15.000Z';
    expect(formatDuration(start, end, 'uk')).toBe('2д 4год');
    expect(formatDetailedDuration(start, end, 'uk')).toBe('2д 4год 30хв 15с');
  });
});

describe('formatDate with includeSeconds', () => {
  it('formats dates without and with seconds', () => {
    const dateStr = '2026-09-01T10:15:30.000Z';
    const withoutSec = formatDate(dateStr, 'en-US', false);
    const withSec = formatDate(dateStr, 'en-US', true);

    expect(withoutSec).toBeDefined();
    expect(withoutSec).not.toBe('-');
    expect(withSec).toBeDefined();
    expect(withSec).toContain('30');
  });

  it('handles null or invalid date safely', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
