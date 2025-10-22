/**
 * Refinance calculator utilities
 * Analyzes whether refinancing makes financial sense
 */

import { RefinanceInputs, RefinanceResult } from '../../components/MortgageCalculator';
import { BREAK_EVEN_EXCELLENT, BREAK_EVEN_GOOD, BREAK_EVEN_MARGINAL, MINIMUM_BALANCE, MAX_ITERATIONS, TIME_HORIZON_5_YEARS, TIME_HORIZON_10_YEARS } from '../constants';

/**
 * Calculate comprehensive refinance analysis
 */
export function calculateRefinanceAnalysis(refInputs: RefinanceInputs): RefinanceResult {
  // New loan amount (current balance + cash out + points cost)
  const pointsCost = refInputs.currentBalance * (refInputs.newPoints / 100);
  const newLoanAmount = refInputs.currentBalance + refInputs.cashOut + pointsCost;
  const totalClosingCosts = refInputs.closingCosts + pointsCost;

  // Calculate new monthly payment
  const newMonthlyRate = refInputs.newRate / 100 / 12;
  const newTotalPayments = refInputs.newTerm * 12;

  const newMonthlyPayment = newMonthlyRate === 0
    ? newLoanAmount / newTotalPayments
    : newLoanAmount * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newTotalPayments)) /
      (Math.pow(1 + newMonthlyRate, newTotalPayments) - 1);

  // Monthly savings
  const monthlySavings = refInputs.currentMonthlyPayment - newMonthlyPayment;

  // Break-even calculation (months to recover closing costs)
  const breakEvenMonths = monthlySavings > 0 ? totalClosingCosts / monthlySavings : Infinity;

  // Calculate total interest for current loan (remaining term)
  const currentTotalInterest = calculateTotalInterest(
    refInputs.currentBalance,
    refInputs.currentRate,
    refInputs.currentMonthlyPayment,
    refInputs.remainingMonths
  );

  // Calculate total interest for new loan
  const newTotalInterest = calculateTotalInterest(
    newLoanAmount,
    refInputs.newRate,
    newMonthlyPayment,
    newTotalPayments
  );

  // Total costs
  const currentTotalCost = currentTotalInterest + (refInputs.currentMonthlyPayment * refInputs.remainingMonths);
  const newTotalCost = totalClosingCosts + newTotalInterest + (newMonthlyPayment * newTotalPayments);

  const interestSavings = currentTotalInterest - newTotalInterest;
  const netSavings = currentTotalCost - newTotalCost;

  // Calculate costs at different time horizons
  const costAt5Years = calculateCostAtMonths(newLoanAmount, newMonthlyRate, newMonthlyPayment, totalClosingCosts, TIME_HORIZON_5_YEARS);
  const costAt10Years = calculateCostAtMonths(newLoanAmount, newMonthlyRate, newMonthlyPayment, totalClosingCosts, TIME_HORIZON_10_YEARS);
  const costAtFullTerm = newTotalCost;

  // Generate recommendation
  const recommendation = generateRecommendation(breakEvenMonths, monthlySavings);

  return {
    newMonthlyPayment,
    monthlySavings,
    totalClosingCosts,
    breakEvenMonths,
    currentTotalInterest,
    newTotalInterest,
    interestSavings,
    currentTotalCost,
    newTotalCost,
    netSavings,
    costAt5Years,
    costAt10Years,
    costAtFullTerm,
    recommendation
  };
}

/**
 * Calculate total interest paid over remaining loan term
 */
function calculateTotalInterest(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  let currentBalance = balance;
  let totalInterest = 0;
  const maxMonths = Math.min(months, MAX_ITERATIONS);

  for (let month = 1; month <= maxMonths && currentBalance > MINIMUM_BALANCE; month++) {
    const interestPayment = currentBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    // Safety check: prevent negative principal payments from causing infinite loop
    if (principalPayment <= 0) {
      console.warn('Loan payment too low to cover interest. Stopping calculation.');
      break;
    }

    totalInterest += interestPayment;
    currentBalance -= principalPayment;
  }

  return totalInterest;
}

/**
 * Calculate total cost at a specific number of months
 */
function calculateCostAtMonths(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number,
  closingCosts: number,
  months: number
): number {
  const totalPayments = Math.ceil(loanAmount / monthlyPayment);
  const monthsToCalc = Math.min(months, totalPayments, MAX_ITERATIONS);
  let balance = loanAmount;

  for (let m = 1; m <= monthsToCalc && balance > MINIMUM_BALANCE; m++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;

    // Safety check
    if (principal <= 0) break;

    balance -= principal;
  }

  return closingCosts + (monthlyPayment * monthsToCalc);
}

/**
 * Generate recommendation based on break-even analysis
 */
function generateRecommendation(breakEvenMonths: number, monthlySavings: number): string {
  if (breakEvenMonths < BREAK_EVEN_EXCELLENT) {
    return 'Excellent! You\'ll break even in less than 2 years. This refinance is highly recommended.';
  } else if (breakEvenMonths < BREAK_EVEN_GOOD) {
    return 'Good opportunity. You\'ll break even in ' + Math.round(breakEvenMonths / 12) + ' years. Worth refinancing if you plan to stay longer.';
  } else if (breakEvenMonths < BREAK_EVEN_MARGINAL) {
    return 'Marginal benefit. Break-even takes ' + Math.round(breakEvenMonths / 12) + ' years. Only refinance if you\'re certain you\'ll keep the loan that long.';
  } else if (monthlySavings < 0) {
    return 'Not recommended. Your monthly payment would increase. Only consider if you need cash-out or to shorten the term.';
  } else {
    return 'Not recommended. The break-even period is too long to justify the closing costs.';
  }
}
