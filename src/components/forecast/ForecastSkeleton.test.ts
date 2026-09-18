import { describe, it, expect } from 'vitest';
import { ForecastSkeleton } from './ForecastSkeleton';

describe('ForecastSkeleton', () => {
  it('is properly defined with memoized displayName', () => {
    expect(ForecastSkeleton).toBeDefined();
    expect(ForecastSkeleton.displayName).toBe('ForecastSkeleton');
  });
});
