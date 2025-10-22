/**
 * Formatting utilities for displaying numbers and currency
 */

/**
 * Format a number as USD currency
 * Handles NaN, Infinity, and edge cases safely
 */
export function formatCurrency(value: number): string {
  if (!isFinite(value) || isNaN(value)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a number with thousand separators (no currency symbol)
 */
export function formatNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, decimalPlaces = 2): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0%';
  }

  return (value).toFixed(decimalPlaces) + '%';
}

/**
 * Format a number of months as years and months
 * e.g., 25 months -> "2 years 1 month"
 */
export function formatMonthsAsYearsMonths(months: number): string {
  if (!isFinite(months) || isNaN(months)) {
    return '0 months';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);

  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(' ') : '0 months';
}

/**
 * Format a number of months as a decimal number of years
 * e.g., 25 months -> "2.08 years"
 */
export function formatMonthsAsYears(months: number, decimalPlaces = 2): string {
  if (!isFinite(months) || isNaN(months)) {
    return '0.00 years';
  }

  return (months / 12).toFixed(decimalPlaces) + ' years';
}
