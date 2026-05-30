import { describe, it, expect } from 'vitest';
import { calculateIngredientCost } from '../utils/costCalculator.js';

describe('calculateIngredientCost', () => {
  it('calculates cost correctly with 100% yield and unit conversion (kg to g)', () => {
    // 1kg costs $10. We use 200g. Yield is 100%.
    // Conversion factor = 1000. Cost per g = 10 / 1000 = 0.01. Raw cost = 0.01 * 200 = 2.
    const cost = calculateIngredientCost(10, 'kg', 200, 'g', 100);
    expect(cost).toBeCloseTo(2);
  });

  it('calculates cost correctly with loss yield (60%)', () => {
    // 1kg costs $10. We use 200g. Yield is 60%.
    // Raw cost = 2. True cost = 2 / (60/100) = 3.333...
    const cost = calculateIngredientCost(10, 'kg', 200, 'g', 60);
    expect(cost).toBeCloseTo(3.333, 3);
  });

  it('calculates cost correctly with the same unit (no conversion)', () => {
    // 1g costs $0.05. We use 100g. Yield is 100%.
    const cost = calculateIngredientCost(0.05, 'g', 100, 'g', 100);
    expect(cost).toBeCloseTo(5);
  });

  it('throws an error for mismatched/unsupported units', () => {
    expect(() => calculateIngredientCost(10, 'kg', 500, 'ml', 100)).toThrowError(
      'Unsupported unit conversion from kg to ml'
    );
  });

  it('throws an error for invalid yield percentage (<= 0)', () => {
    expect(() => calculateIngredientCost(10, 'kg', 200, 'g', 0)).toThrowError(
      'Yield percentage must be between 1 and 100.'
    );
  });

  it('throws an error for invalid yield percentage (> 100)', () => {
    expect(() => calculateIngredientCost(10, 'kg', 200, 'g', 150)).toThrowError(
      'Yield percentage must be between 1 and 100.'
    );
  });
});
