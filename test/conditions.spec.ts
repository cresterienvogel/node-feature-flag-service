import { matchesConditions } from '../src/common/conditions.util';

describe('conditions', () => {
  it('matches simple user and tenant conditions', () => {
    const subject = {
      key: 'u1',
      userId: 'u1',
      tenantId: 't1',
      attributes: { country: 'US', plan: 'pro' },
    };

    const conditions = {
      userId: ['u1', 'u2'],
      tenantId: 't1',
      country: 'US',
      plan: ['pro', 'enterprise'],
      attrs: { region: 'na' },
    };

    expect(matchesConditions(subject, conditions as any)).toBe(false);

    const conditions2 = {
      userId: 'u1',
      tenantId: 't1',
      country: 'US',
      plan: 'pro',
    };

    expect(matchesConditions(subject, conditions2 as any)).toBe(true);
  });
});
