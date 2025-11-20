/**
 * Chart Data Transformation Utilities
 *
 * Helper functions to transform mortgage calculation data into formats
 * compatible with chart components (Recharts).
 */

import { ScheduleEntry } from './calculations/amortizationSchedule';

/**
 * Transform amortization schedule to balance over time line chart data
 * Samples data points to avoid overwhelming the chart with too many points
 */
export const transformBalanceOverTime = (
  schedule: ScheduleEntry[],
  maxPoints: number = 50
): Array<{ name: string; balance: number }> => {
  if (schedule.length === 0) return [];

  const step = Math.max(1, Math.floor(schedule.length / maxPoints));
  const sampledData = schedule.filter((_, index) => index % step === 0 || index === schedule.length - 1);

  return sampledData.map((entry) => ({
    name: `Year ${Math.floor(entry.month / 12)}`,
    balance: entry.balance,
  }));
};

/**
 * Transform amortization schedule to principal vs interest pie chart data
 */
export const transformPrincipalVsInterest = (
  schedule: ScheduleEntry[]
): Array<{ name: string; value: number }> => {
  if (schedule.length === 0) return [];

  const totalPrincipal = schedule.reduce((sum, entry) => sum + entry.principal, 0);
  const totalInterest = schedule.reduce((sum, entry) => sum + entry.interest, 0);

  return [
    { name: 'Principal', value: totalPrincipal },
    { name: 'Interest', value: totalInterest },
  ];
};

/**
 * Transform amortization schedule to stacked area chart data (Principal + Interest over time)
 * Samples data to avoid overwhelming the chart
 */
export const transformPaymentBreakdown = (
  schedule: ScheduleEntry[],
  maxPoints: number = 50
): Array<{ name: string; principal: number; interest: number }> => {
  if (schedule.length === 0) return [];

  const step = Math.max(1, Math.floor(schedule.length / maxPoints));
  const sampledData = schedule.filter((_, index) => index % step === 0 || index === schedule.length - 1);

  return sampledData.map((entry) => ({
    name: `Year ${Math.floor(entry.month / 12)}`,
    principal: entry.principal,
    interest: entry.interest,
  }));
};

/**
 * Transform amortization schedule to cumulative interest paid over time
 */
export const transformCumulativeInterest = (
  schedule: ScheduleEntry[],
  maxPoints: number = 50
): Array<{ name: string; cumulativeInterest: number }> => {
  if (schedule.length === 0) return [];

  // Use the totalInterest field which is already cumulative
  const step = Math.max(1, Math.floor(schedule.length / maxPoints));
  const sampledData = schedule.filter((_, index) => index % step === 0 || index === schedule.length - 1);

  return sampledData.map((entry) => ({
    name: `Year ${Math.floor(entry.month / 12)}`,
    cumulativeInterest: entry.totalInterest,
  }));
};

/**
 * Compare two schedules (e.g., current vs new loan, or standard vs accelerated)
 * Returns dual-line chart data
 */
export const transformScheduleComparison = (
  schedule1: ScheduleEntry[],
  schedule2: ScheduleEntry[],
  label1: string = 'Current',
  label2: string = 'New',
  maxPoints: number = 50
): Array<{ name: string; [key: string]: string | number }> => {
  // Use the longer schedule as the base
  const maxLength = Math.max(schedule1.length, schedule2.length);
  const step = Math.max(1, Math.floor(maxLength / maxPoints));

  const result = [];
  for (let i = 0; i < maxLength; i += step) {
    const entry1 = schedule1[i];
    const entry2 = schedule2[i];

    result.push({
      name: `Year ${Math.floor((entry1?.month || entry2?.month || i) / 12)}`,
      [label1]: entry1?.balance || 0,
      [label2]: entry2?.balance || 0,
    });
  }

  // Always include the final point
  const finalEntry1 = schedule1[schedule1.length - 1];
  const finalEntry2 = schedule2[schedule2.length - 1];
  if (finalEntry1 || finalEntry2) {
    result.push({
      name: `Year ${Math.floor((finalEntry1?.month || finalEntry2?.month || 0) / 12)}`,
      [label1]: finalEntry1?.balance || 0,
      [label2]: finalEntry2?.balance || 0,
    });
  }

  return result;
};

/**
 * Transform paydown strategy comparison data for bar chart
 */
export const transformPaydownComparison = (strategies: Array<{
  name: string;
  totalInterest: number;
  monthsToPayoff: number;
  totalPaid: number;
}>): Array<{ name: string; interest: number; months: number }> => {
  return strategies.map((strategy) => ({
    name: strategy.name,
    interest: strategy.totalInterest,
    months: strategy.monthsToPayoff,
  }));
};

/**
 * Transform points comparison data for bar/line charts
 */
export const transformPointsComparison = (scenarios: Array<{
  name: string;
  monthlyPayment: number;
  totalCost5Year?: number;
  totalCost10Year?: number;
  totalCostFullTerm?: number;
  breakEvenMonths?: number;
}>): {
  monthlyPayments: Array<{ name: string; payment: number }>;
  costComparison: Array<{ name: string; '5 Years': number; '10 Years': number; 'Full Term': number }>;
  breakEven: Array<{ name: string; months: number }>;
} => {
  return {
    monthlyPayments: scenarios.map((s) => ({
      name: s.name,
      payment: s.monthlyPayment,
    })),
    costComparison: scenarios.map((s) => ({
      name: s.name,
      '5 Years': s.totalCost5Year || 0,
      '10 Years': s.totalCost10Year || 0,
      'Full Term': s.totalCostFullTerm || 0,
    })),
    breakEven: scenarios
      .filter((s) => s.breakEvenMonths !== undefined)
      .map((s) => ({
        name: s.name,
        months: s.breakEvenMonths || 0,
      })),
  };
};

/**
 * Transform refinance comparison data
 */
export const transformRefinanceComparison = (
  currentLoan: {
    monthlyPayment: number;
    remainingBalance: number;
    totalInterest: number;
  },
  newLoan: {
    monthlyPayment: number;
    loanAmount: number;
    totalInterest: number;
    closingCosts: number;
  }
): {
  monthlyPayments: Array<{ name: string; payment: number }>;
  totalCosts: Array<{ name: string; Principal: number; Interest: number; 'Closing Costs': number }>;
} => {
  return {
    monthlyPayments: [
      { name: 'Current', payment: currentLoan.monthlyPayment },
      { name: 'New', payment: newLoan.monthlyPayment },
    ],
    totalCosts: [
      {
        name: 'Current',
        Principal: currentLoan.remainingBalance,
        Interest: currentLoan.totalInterest,
        'Closing Costs': 0,
      },
      {
        name: 'New',
        Principal: newLoan.loanAmount,
        Interest: newLoan.totalInterest,
        'Closing Costs': newLoan.closingCosts,
      },
    ],
  };
};

/**
 * Sample large datasets to reduce chart rendering overhead
 * Uses intelligent sampling to preserve trends
 */
export const sampleData = <T extends { name: string }>(
  data: T[],
  maxPoints: number = 50
): T[] => {
  if (data.length <= maxPoints) return data;

  const step = Math.floor(data.length / maxPoints);
  const sampled = data.filter((_, index) => index % step === 0);

  // Always include the last data point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
};
