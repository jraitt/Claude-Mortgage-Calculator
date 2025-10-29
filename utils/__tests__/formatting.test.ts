/**
 * Unit tests for formatting utility functions
 */

import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatMonthsAsYearsMonths,
  formatDate,
} from '../formatting';

describe('formatCurrency', () => {
  test('should format positive amounts correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    expect(formatCurrency(0.99)).toBe('$0.99');
  });

  test('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('should format negative amounts correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    expect(formatCurrency(-100)).toBe('-$100.00');
  });

  test('should handle very large numbers', () => {
    expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
  });

  test('should handle very small numbers', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
    expect(formatCurrency(0.001)).toBe('$0.00'); // Rounds to nearest cent
  });

  test('should handle undefined and null', () => {
    expect(formatCurrency(undefined as any)).toBe('$0.00');
    expect(formatCurrency(null as any)).toBe('$0.00');
  });
});

describe('formatPercentage', () => {
  test('should format percentages correctly', () => {
    expect(formatPercentage(6.5)).toBe('6.50%');
    expect(formatPercentage(0.75)).toBe('0.75%');
    expect(formatPercentage(12)).toBe('12.00%');
  });

  test('should format zero correctly', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  test('should format negative percentages', () => {
    expect(formatPercentage(-2.5)).toBe('-2.50%');
  });

  test('should handle very small percentages', () => {
    expect(formatPercentage(0.01)).toBe('0.01%');
    expect(formatPercentage(0.001)).toBe('0.00%');
  });

  test('should handle very large percentages', () => {
    expect(formatPercentage(100)).toBe('100.00%');
    expect(formatPercentage(999.99)).toBe('999.99%');
  });

  test('should handle custom decimal places', () => {
    expect(formatPercentage(6.5, 1)).toBe('6.5%');
    expect(formatPercentage(6.5, 3)).toBe('6.500%');
    expect(formatPercentage(6.5, 0)).toBe('7%'); // Rounds to nearest whole
  });
});

describe('formatNumber', () => {
  test('should format numbers with commas', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(1000)).toBe('1,000');
  });

  test('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  test('should handle negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
    expect(formatNumber(-1000000)).toBe('-1,000,000');
  });

  test('should handle decimal numbers', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
    expect(formatNumber(1000.1)).toBe('1,000.1');
  });

  test('should handle very large numbers', () => {
    expect(formatNumber(999999999)).toBe('999,999,999');
  });

  test('should handle numbers less than 1000', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(99.99)).toBe('99.99');
  });
});

describe('formatMonthsAsYearsMonths', () => {
  test('should format exact years correctly', () => {
    expect(formatMonthsAsYearsMonths(12)).toBe('1 year');
    expect(formatMonthsAsYearsMonths(24)).toBe('2 years');
    expect(formatMonthsAsYearsMonths(60)).toBe('5 years');
  });

  test('should format years and months correctly', () => {
    expect(formatMonthsAsYearsMonths(13)).toBe('1 year, 1 month');
    expect(formatMonthsAsYearsMonths(14)).toBe('1 year, 2 months');
    expect(formatMonthsAsYearsMonths(25)).toBe('2 years, 1 month');
    expect(formatMonthsAsYearsMonths(26)).toBe('2 years, 2 months');
  });

  test('should format months only when less than a year', () => {
    expect(formatMonthsAsYearsMonths(1)).toBe('1 month');
    expect(formatMonthsAsYearsMonths(6)).toBe('6 months');
    expect(formatMonthsAsYearsMonths(11)).toBe('11 months');
  });

  test('should handle zero months', () => {
    expect(formatMonthsAsYearsMonths(0)).toBe('0 months');
  });

  test('should handle large numbers', () => {
    expect(formatMonthsAsYearsMonths(360)).toBe('30 years');
    expect(formatMonthsAsYearsMonths(361)).toBe('30 years, 1 month');
  });

  test('should handle negative numbers', () => {
    expect(formatMonthsAsYearsMonths(-12)).toBe('0 months');
  });

  test('should handle decimal numbers by rounding', () => {
    expect(formatMonthsAsYearsMonths(12.7)).toBe('1 year, 1 month');
    expect(formatMonthsAsYearsMonths(11.3)).toBe('11 months');
  });
});

describe('formatDate', () => {
  test('should format current date correctly', () => {
    const result = formatDate(0);
    const now = new Date();
    const expected = now.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    expect(result).toBe(expected);
  });

  test('should format future dates correctly', () => {
    const result = formatDate(12); // 12 months from now
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 12);
    const expected = futureDate.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    expect(result).toBe(expected);
  });

  test('should format past dates correctly', () => {
    const result = formatDate(-6); // 6 months ago
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 6);
    const expected = pastDate.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    expect(result).toBe(expected);
  });

  test('should handle large month offsets', () => {
    const result = formatDate(360); // 30 years from now
    expect(result).toMatch(/^\w{3} \d{4}$/); // Should match "MMM YYYY" format
  });

  test('should handle zero offset', () => {
    const result = formatDate(0);
    expect(result).toMatch(/^\w{3} \d{4}$/);
  });

  test('should handle negative large offsets', () => {
    const result = formatDate(-120); // 10 years ago
    expect(result).toMatch(/^\w{3} \d{4}$/);
  });
});