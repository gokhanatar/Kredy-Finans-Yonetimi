import { describe, it, expect } from 'vitest';
import {
  calculateKMHDailyInterest,
  validateKMHLimit,
  getKMHSeverity,
  getKMHUsagePercent,
  calculateKMHProjection,
  calculateDaysNegative,
} from '@/lib/kmhUtils';
import { Account, KMH_CONSTANTS } from '@/types/familyFinance';

describe('kmhUtils', () => {
  describe('calculateKMHDailyInterest', () => {
    it('should return zero for positive balance', () => {
      const result = calculateKMHDailyInterest(1000, 4.25, 10);
      expect(result.grossInterest).toBe(0);
      expect(result.netCost).toBe(0);
    });

    it('should return zero for zero days', () => {
      const result = calculateKMHDailyInterest(-5000, 4.25, 0);
      expect(result.grossInterest).toBe(0);
    });

    it('should calculate daily interest correctly', () => {
      // 5000 TL × (4.25/100/30) × 10 gün = 70.83 TL brüt
      const result = calculateKMHDailyInterest(-5000, 4.25, 10);
      expect(result.grossInterest).toBeCloseTo(70.83, 1);
      // net = brüt × 1.20 = 85.00
      expect(result.netCost).toBeCloseTo(85.0, 0);
      expect(result.daysNegative).toBe(10);
    });

    it('should calculate 30-day interest correctly', () => {
      // 10000 TL × (4.25/100/30) × 30 gün = 425 TL brüt
      const result = calculateKMHDailyInterest(-10000, 4.25, 30);
      expect(result.grossInterest).toBeCloseTo(425, 0);
      // net = 425 × 1.20 = 510
      expect(result.netCost).toBeCloseTo(510, 0);
    });

    it('should use temerrüt rate correctly', () => {
      const result = calculateKMHDailyInterest(-10000, 4.55, 30);
      // 10000 × (4.55/100/30) × 30 = 455 brüt
      expect(result.grossInterest).toBeCloseTo(455, 0);
      // 455 × 1.20 = 546
      expect(result.netCost).toBeCloseTo(546, 0);
    });
  });

  describe('validateKMHLimit', () => {
    it('should validate within limit', () => {
      const result = validateKMHLimit(20000, 15000);
      expect(result.isValid).toBe(true);
      expect(result.maxAllowed).toBe(30000);
    });

    it('should reject over limit', () => {
      const result = validateKMHLimit(40000, 15000);
      expect(result.isValid).toBe(false);
      expect(result.maxAllowed).toBe(30000);
      expect(result.message).toBeTruthy();
    });

    it('should accept exactly at limit', () => {
      const result = validateKMHLimit(30000, 15000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getKMHSeverity', () => {
    const baseAccount: Account = {
      id: '1',
      name: 'Test',
      type: 'bank',
      balance: 0,
      currency: 'TRY',
      icon: 'building',
      color: 'blue',
      isActive: true,
      kmhEnabled: true,
      kmhLimit: 10000,
    };

    it('should return none for positive balance', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: 100 })).toBe('none');
    });

    it('should return none when KMH disabled', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: -1000, kmhEnabled: false })).toBe('none');
    });

    it('should return low for < 25% usage', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: -2000 })).toBe('low');
    });

    it('should return medium for 25-50% usage', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: -4000 })).toBe('medium');
    });

    it('should return high for 50-75% usage', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: -6000 })).toBe('high');
    });

    it('should return critical for > 75% usage', () => {
      expect(getKMHSeverity({ ...baseAccount, balance: -8000 })).toBe('critical');
    });
  });

  describe('getKMHUsagePercent', () => {
    it('should return 0 for positive balance', () => {
      expect(getKMHUsagePercent({
        id: '1', name: 'Test', type: 'bank', balance: 100, currency: 'TRY',
        icon: 'building', color: 'blue', isActive: true, kmhEnabled: true, kmhLimit: 10000,
      })).toBe(0);
    });

    it('should calculate usage percentage correctly', () => {
      expect(getKMHUsagePercent({
        id: '1', name: 'Test', type: 'bank', balance: -5000, currency: 'TRY',
        icon: 'building', color: 'blue', isActive: true, kmhEnabled: true, kmhLimit: 10000,
      })).toBe(50);
    });

    it('should cap at 100%', () => {
      expect(getKMHUsagePercent({
        id: '1', name: 'Test', type: 'bank', balance: -15000, currency: 'TRY',
        icon: 'building', color: 'blue', isActive: true, kmhEnabled: true, kmhLimit: 10000,
      })).toBe(100);
    });
  });

  describe('calculateKMHProjection', () => {
    it('should return empty for positive balance', () => {
      const result = calculateKMHProjection(1000, 4.25, [7, 14, 30]);
      expect(result).toHaveLength(0);
    });

    it('should project future interest', () => {
      const result = calculateKMHProjection(-10000, 4.25, [7, 14, 30]);
      expect(result).toHaveLength(3);
      expect(result[0].days).toBe(7);
      expect(result[0].accruedInterest).toBeGreaterThan(0);
      expect(result[2].accruedInterest).toBeGreaterThan(result[0].accruedInterest);
    });
  });

  describe('calculateDaysNegative', () => {
    it('should return 0 for undefined date', () => {
      expect(calculateDaysNegative(undefined)).toBe(0);
    });

    it('should calculate days from past date', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(calculateDaysNegative(twoDaysAgo.toISOString())).toBe(2);
    });
  });
});
