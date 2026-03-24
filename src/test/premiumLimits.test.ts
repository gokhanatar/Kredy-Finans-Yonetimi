import { describe, it, expect } from 'vitest';
import { checkLimit, FREE_LIMITS } from '@/lib/premiumLimits';

describe('checkLimit', () => {
  it('allows free user below card limit', () => {
    const result = checkLimit('CARDS', 1, false);
    expect(result).toEqual({ allowed: true, current: 1, limit: 2 });
  });

  it('blocks free user at card limit', () => {
    const result = checkLimit('CARDS', 2, false);
    expect(result).toEqual({ allowed: false, current: 2, limit: 2 });
  });

  it('allows premium user above card limit', () => {
    const result = checkLimit('CARDS', 10, true);
    expect(result).toEqual({ allowed: true, current: 10, limit: Infinity });
  });

  it('allows free user below account limit', () => {
    const result = checkLimit('ACCOUNTS', 1, false);
    expect(result).toEqual({ allowed: true, current: 1, limit: 2 });
  });

  it('blocks free user at account limit', () => {
    const result = checkLimit('ACCOUNTS', 2, false);
    expect(result).toEqual({ allowed: false, current: 2, limit: 2 });
  });

  it('allows free user below recurring bills limit', () => {
    const result = checkLimit('RECURRING_BILLS', 2, false);
    expect(result).toEqual({ allowed: true, current: 2, limit: 3 });
  });

  it('blocks free user at recurring bills limit', () => {
    const result = checkLimit('RECURRING_BILLS', 3, false);
    expect(result).toEqual({ allowed: false, current: 3, limit: 3 });
  });

  it('allows free user below goals limit', () => {
    const result = checkLimit('GOALS', 0, false);
    expect(result).toEqual({ allowed: true, current: 0, limit: 1 });
  });

  it('blocks free user at goals limit', () => {
    const result = checkLimit('GOALS', 1, false);
    expect(result).toEqual({ allowed: false, current: 1, limit: 1 });
  });

  it('allows free user below budgets limit', () => {
    const result = checkLimit('BUDGETS', 0, false);
    expect(result).toEqual({ allowed: true, current: 0, limit: 1 });
  });

  it('blocks free user at budgets limit', () => {
    const result = checkLimit('BUDGETS', 1, false);
    expect(result).toEqual({ allowed: false, current: 1, limit: 1 });
  });

  it('allows free user below transaction limit', () => {
    const result = checkLimit('MONTHLY_TRANSACTIONS', 49, false);
    expect(result).toEqual({ allowed: true, current: 49, limit: 50 });
  });

  it('blocks free user at transaction limit', () => {
    const result = checkLimit('MONTHLY_TRANSACTIONS', 50, false);
    expect(result).toEqual({ allowed: false, current: 50, limit: 50 });
  });

  it('always allows premium user for all limit types', () => {
    const keys = Object.keys(FREE_LIMITS) as Array<keyof typeof FREE_LIMITS>;
    for (const key of keys) {
      const result = checkLimit(key, 999, true);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    }
  });
});
