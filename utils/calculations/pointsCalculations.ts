/**
 * Mortgage points calculator utilities
 * Analyzes break-even and costs for different rate/points scenarios
 */

import { PointsScenario, ComparisonResult } from '../../components/MortgageCalculator';

/**
 * Calculate metrics for a single points scenario
 */
export function calculateScenarioMetrics(
  scenario: PointsScenario,
  loanAmount: number,
  term: number
): ComparisonResult {
  const monthlyRate = scenario.rate / 100 / 12;
  const totalPayments = term * 12;

  // Calculate monthly P&I
  const monthlyPI = monthlyRate === 0
    ? loanAmount / totalPayments
    : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

  // Calculate point cost
  const pointCost = loanAmount * (scenario.points / 100);

  // Calculate total interest over loan life
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  for (let month = 1; month <= totalPayments && remainingBalance > 0.01; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPI - interestPayment;
    totalInterest += interestPayment;
    remainingBalance -= principalPayment;
  }

  // Total cost = point cost + all payments
  const totalCost = pointCost + (monthlyPI * totalPayments);

  // Calculate total cost at different time horizons
  const costAt5Years = calculateCostAtMonth(monthlyPI, monthlyRate, loanAmount, pointCost, 60);
  const costAt10Years = calculateCostAtMonth(monthlyPI, monthlyRate, loanAmount, pointCost, 120);

  return {
    scenario,
    monthlyPI,
    pointCost,
    totalInterest,
    totalCost,
    breakEvenMonths: null, // Calculated separately vs baseline
    monthlySavings: 0, // Calculated separately vs baseline
    totalCostAt5Years: costAt5Years,
    totalCostAt10Years: costAt10Years,
    totalCostAtFullTerm: totalCost
  };
}

/**
 * Calculate total cost at a specific number of months
 */
function calculateCostAtMonth(
  monthlyPI: number,
  monthlyRate: number,
  loanAmount: number,
  pointCost: number,
  months: number
): number {
  const totalPayments = Math.ceil(loanAmount / monthlyPI);
  const paymentsToCalculate = Math.min(months, totalPayments);

  let balance = loanAmount;
  for (let m = 1; m <= paymentsToCalculate; m++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPI - interest;
    balance -= principal;
  }

  return pointCost + (monthlyPI * paymentsToCalculate);
}

/**
 * Calculate break-even vs baseline scenario
 */
export function calculateBreakEven(
  result: ComparisonResult,
  baseline: ComparisonResult
): ComparisonResult {
  const pointCostDiff = result.pointCost - baseline.pointCost;
  const monthlySavings = baseline.monthlyPI - result.monthlyPI;

  let breakEvenMonths = null;
  if (monthlySavings > 0 && pointCostDiff > 0) {
    breakEvenMonths = pointCostDiff / monthlySavings;
  }

  return {
    ...result,
    monthlySavings,
    breakEvenMonths
  };
}

/**
 * Calculate all comparison results for points scenarios
 */
export function calculateComparisonResults(
  scenarios: PointsScenario[],
  loanAmount: number,
  term: number
): ComparisonResult[] {
  const baseline = scenarios.find(s => s.isBaseline);
  if (!baseline) return [];

  const baselineResult = calculateScenarioMetrics(baseline, loanAmount, term);
  const results = scenarios.map(scenario => {
    const result = calculateScenarioMetrics(scenario, loanAmount, term);
    return scenario.isBaseline ? result : calculateBreakEven(result, baselineResult);
  });

  return results;
}
