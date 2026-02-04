import { bucket, stableHashInt } from '../src/common/hash.util';

describe('hashing', () => {
  it('is deterministic for the same input', () => {
    const first = stableHashInt('feature:subject');
    const second = stableHashInt('feature:subject');
    expect(first).toBe(second);
  });

  it('buckets are within range', () => {
    const value = bucket('feature:subject', 100);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(100);
  });
});
