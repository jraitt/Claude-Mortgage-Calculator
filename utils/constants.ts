// Mortgage Calculator Constants

// Break-even time horizons (in months)
export const BREAK_EVEN_EXCELLENT = 24; // Less than 2 years
export const BREAK_EVEN_GOOD = 60; // Less than 5 years
export const BREAK_EVEN_MARGINAL = 120; // Less than 10 years

// Time horizon analysis periods (in months)
export const TIME_HORIZON_5_YEARS = 60;
export const TIME_HORIZON_10_YEARS = 120;

// Calculation precision
export const MINIMUM_BALANCE = 0.01; // Stop calculations when balance is below this
export const MAX_ITERATIONS = 10000; // Prevent infinite loops

// PMI thresholds
export const PMI_LTV_THRESHOLD = 78; // PMI removed when LTV reaches 78%

// Bi-weekly payment periods
export const BIWEEKLY_PERIODS_PER_YEAR = 26;

// Input validation limits
export const MIN_INTEREST_RATE = 0;
export const MAX_INTEREST_RATE = 30; // 30% is extremely high but possible
export const MIN_LOAN_AMOUNT = 1000;
export const MAX_LOAN_AMOUNT = 100000000; // $100M should be reasonable upper limit
export const MIN_LOAN_TERM = 1; // 1 year
export const MAX_LOAN_TERM = 50; // 50 years
export const MIN_CLOSING_COSTS = 0;
export const MAX_CLOSING_COSTS = 1000000; // $1M
export const MAX_POINTS = 10; // 10% in points is very high
export const MIN_REMAINING_MONTHS = 1;
export const MAX_REMAINING_MONTHS = 600; // 50 years
