import { bucket } from '../src/common/hash.util';

describe('variants', () => {
  it('distributes roughly by weight for fixed subjects', () => {
    const variants = [
      { key: 'A', weight: 70 },
      { key: 'B', weight: 30 },
    ];

    const total = variants.reduce((acc, v) => acc + v.weight, 0);
    const pick = (subjectKey: string) => {
      const value = bucket(`feature:${subjectKey}:rule`, total);
      let cursor = 0;
      for (const variant of variants) {
        cursor += variant.weight;
        if (value < cursor) return variant.key;
      }
      return null;
    };

    let countA = 0;
    let countB = 0;
    for (let i = 0; i < 100; i += 1) {
      const picked = pick(`subject-${i}`);
      if (picked === 'A') countA += 1;
      if (picked === 'B') countB += 1;
    }

    expect(countA + countB).toBe(100);
    expect(countA).toBeGreaterThanOrEqual(55);
    expect(countA).toBeLessThanOrEqual(85);
  });
});
