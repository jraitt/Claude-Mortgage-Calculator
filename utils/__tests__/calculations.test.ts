/**
 * Unit tests for mortgage calculation functions
 */

import {
  BREAK_EVEN_EXCELLENT,
  BREAK_EVEN_GOOD,
  BREAK_EVEN_MARGINAL,
  TIME_HORIZON_5_YEARS,
  TIME_HORIZON_10_YEARS,
  MINIMUM_BALANCE,
  PMI_LTV_THRESHOLD,
} from '../constants';

describe('Mortgage Payment Calculation', () => {
  /**
   * Calculate monthly mortgage payment using standard formula
   */
  function calculateMonthlyPayment(
    loanAmount: number,
    annualRate: number,
    loanTermYears: number
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = loanTermYears * 12;

    if (monthlyRate === 0) {
      return loanAmount / totalPayments;
    }

    return (
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );
  }

  test('should calculate correct monthly payment for standard 30-year mortgage', () => {
    const loanAmount = 300000;
    const annualRate = 6.5;
    const loanTermYears = 30;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, loanTermYears);

    // Expected payment is approximately $1,896.20
    expect(monthlyPayment).toBeCloseTo(1896.20, 2);
  });

  test('should calculate correct monthly payment for 15-year mortgage', () => {
    const loanAmount = 250000;
    const annualRate = 5.5;
    const loanTermYears = 15;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, loanTermYears);

    // Expected payment is approximately $2,042.71
    expect(monthlyPayment).toBeCloseTo(2042.71, 2);
  });

  test('should handle zero interest rate', () => {
    const loanAmount = 300000;
    const annualRate = 0;
    const loanTermYears = 30;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, loanTermYears);

    // With 0% interest, payment should be principal divided by months
    expect(monthlyPayment).toBe(300000 / (30 * 12));
    expect(monthlyPayment).toBeCloseTo(833.33, 2);
  });

  test('should handle very high interest rates', () => {
    const loanAmount = 100000;
    const annualRate = 20; // High but possible interest rate
    const loanTermYears = 30;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, loanTermYears);

    // Payment should be positive and reasonable
    expect(monthlyPayment).toBeGreaterThan(0);
    expect(monthlyPayment).toBeCloseTo(1671.02, 2);
  });
});

describe('Break-Even Analysis', () => {
  function calculateBreakEven(
    closingCosts: number,
    monthlySavings: number
  ): number {
    if (monthlySavings <= 0) {
      return Infinity;
    }
    return closingCosts / monthlySavings;
  }

  test('should calculate break-even for typical refinance', () => {
    const closingCosts = 3000;
    const monthlySavings = 150;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(20); // 20 months
  });

  test('should return Infinity when monthly savings is zero', () => {
    const closingCosts = 3000;
    const monthlySavings = 0;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(Infinity);
  });

  test('should return Infinity when monthly savings is negative', () => {
    const closingCosts = 3000;
    const monthlySavings = -100;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(Infinity);
  });

  test('break-even should be classified as excellent when less than 24 months', () => {
    const closingCosts = 2000;
    const monthlySavings = 100;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(20);
    expect(breakEven).toBeLessThan(BREAK_EVEN_EXCELLENT);
  });

  test('break-even should be classified as good when between 24-60 months', () => {
    const closingCosts = 3000;
    const monthlySavings = 75;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(40);
    expect(breakEven).toBeGreaterThan(BREAK_EVEN_EXCELLENT);
    expect(breakEven).toBeLessThan(BREAK_EVEN_GOOD);
  });

  test('break-even should be classified as marginal when between 60-120 months', () => {
    const closingCosts = 5000;
    const monthlySavings = 50;

    const breakEven = calculateBreakEven(closingCosts, monthlySavings);

    expect(breakEven).toBe(100);
    expect(breakEven).toBeGreaterThan(BREAK_EVEN_GOOD);
    expect(breakEven).toBeLessThan(BREAK_EVEN_MARGINAL);
  });
});

describe('Interest Calculation', () => {
  function calculateTotalInterest(
    loanAmount: number,
    monthlyPayment: number,
    monthlyRate: number,
    maxMonths: number
  ): number {
    let totalInterest = 0;
    let balance = loanAmount;
    let month = 0;

    while (balance > MINIMUM_BALANCE && month < maxMonths) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;

      if (principal <= 0) break; // Prevent infinite loop

      totalInterest += interest;
      balance -= principal;
      month++;
    }

    return totalInterest;
  }

  test('should calculate total interest for standard 30-year mortgage', () => {
    const loanAmount = 300000;
    const annualRate = 6.5;
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = 30 * 12;

    // Calculate monthly payment first
    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalInterest = calculateTotalInterest(
      loanAmount,
      monthlyPayment,
      monthlyRate,
      totalMonths
    );

    // Total interest for a $300k loan at 6.5% over 30 years should be approximately $382,633
    expect(totalInterest).toBeGreaterThan(380000);
    expect(totalInterest).toBeLessThan(385000);
  });

  test('should calculate zero interest for zero interest rate', () => {
    const loanAmount = 300000;
    const monthlyRate = 0;
    const totalMonths = 30 * 12;
    const monthlyPayment = loanAmount / totalMonths;

    const totalInterest = calculateTotalInterest(
      loanAmount,
      monthlyPayment,
      monthlyRate,
      totalMonths
    );

    expect(totalInterest).toBe(0);
  });

  test('should stop calculation when principal payment becomes negative', () => {
    const loanAmount = 300000;
    const monthlyRate = 0.10 / 12; // 10% annual rate
    const monthlyPayment = 100; // Too low to cover interest
    const maxMonths = 1000;

    const totalInterest = calculateTotalInterest(
      loanAmount,
      monthlyPayment,
      monthlyRate,
      maxMonths
    );

    // Should stop immediately since payment doesn't cover interest
    expect(totalInterest).toBe(0);
  });
});

describe('PMI Calculation', () => {
  test('PMI threshold should be 78% LTV', () => {
    expect(PMI_LTV_THRESHOLD).toBe(78);
  });

  test('should apply PMI when LTV is above threshold', () => {
    const homePrice = 400000;
    const loanAmount = 320000; // 80% LTV
    const ltvRatio = (loanAmount / homePrice) * 100;

    expect(ltvRatio).toBeGreaterThan(PMI_LTV_THRESHOLD);
    // PMI should be applied
  });

  test('should not apply PMI when LTV is at or below threshold', () => {
    const homePrice = 400000;
    const loanAmount = 310000; // 77.5% LTV
    const ltvRatio = (loanAmount / homePrice) * 100;

    expect(ltvRatio).toBeLessThanOrEqual(PMI_LTV_THRESHOLD);
    // PMI should not be applied
  });
});

describe('Constants Validation', () => {
  test('time horizon constants should be correct', () => {
    expect(TIME_HORIZON_5_YEARS).toBe(60);
    expect(TIME_HORIZON_10_YEARS).toBe(120);
  });

  test('break-even constants should be in ascending order', () => {
    expect(BREAK_EVEN_EXCELLENT).toBeLessThan(BREAK_EVEN_GOOD);
    expect(BREAK_EVEN_GOOD).toBeLessThan(BREAK_EVEN_MARGINAL);
  });

  test('minimum balance should be very small positive number', () => {
    expect(MINIMUM_BALANCE).toBeGreaterThan(0);
    expect(MINIMUM_BALANCE).toBeLessThan(1);
  });
});
