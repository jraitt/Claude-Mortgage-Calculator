/**
 * Refinance calculator utilities
 * Analyzes whether refinancing makes financial sense
 */

import { RefinanceInputs, RefinanceResult } from '../../components/MortgageCalculator';
import { BREAK_EVEN_EXCELLENT, BREAK_EVEN_GOOD, BREAK_EVEN_MARGINAL, MINIMUM_BALANCE, MAX_ITERATIONS, TIME_HORIZON_5_YEARS, TIME_HORIZON_10_YEARS } from '../constants';

/**
 * Calculate remaining months on current loan based on balance, rate, and payment
 */
function calculateRemainingMonths(balance: number, annualRate: number, monthlyPayment: number): number {
  if (annualRate === 0) {
    // If no interest, just divide balance by payment
    return Math.ceil(balance / monthlyPayment);
  }

  const monthlyRate = annualRate / 100 / 12;
  
  // Use amortization formula solved for n (number of payments)
  // n = log(P / (P - B * r)) / log(1 + r)
  // where P = monthly payment, B = balance, r = monthly rate
  
  if (monthlyPayment <= balance * monthlyRate) {
    // Payment is too low to cover interest - loan will never be paid off
    return MAX_ITERATIONS;
  }

  const remainingMonths = Math.log(monthlyPayment / (monthlyPayment - balance * monthlyRate)) / Math.log(1 + monthlyRate);
  
  return Math.ceil(remainingMonths);
}

/**
 * Calculate comprehensive refinance analysis
 */
export function calculateRefinanceAnalysis(refInputs: RefinanceInputs): RefinanceResult {
  // Calculate remaining months automatically
  const remainingMonths = calculateRemainingMonths(
    refInputs.currentBalance,
    refInputs.currentRate,
    refInputs.currentMonthlyPayment
  );
  // New loan amount (current balance + cash out + points cost + closing costs if included)
  const pointsCost = refInputs.currentBalance * ((refInputs.newPoints || 0) / 100);
  const closingCostsInLoan = refInputs.includeClosingCostsInLoan ? refInputs.closingCosts : 0;
  const newLoanAmount = refInputs.currentBalance + (refInputs.cashOut || 0) + pointsCost + closingCostsInLoan;
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
    remainingMonths
  );

  // Calculate total interest for new loan
  const newTotalInterest = calculateTotalInterest(
    newLoanAmount,
    refInputs.newRate,
    newMonthlyPayment,
    newTotalPayments
  );

  // Total costs
  const currentTotalCost = currentTotalInterest + (refInputs.currentMonthlyPayment * remainingMonths);
  const newTotalCost = totalClosingCosts + newTotalInterest + (newMonthlyPayment * newTotalPayments);

  const interestSavings = currentTotalInterest - newTotalInterest;
  const netSavings = currentTotalCost - newTotalCost;

  // Calculate costs at different time horizons
  const costAt5Years = calculateCostAtMonths(newLoanAmount, newMonthlyRate, newMonthlyPayment, totalClosingCosts, TIME_HORIZON_5_YEARS);
  const costAt10Years = calculateCostAtMonths(newLoanAmount, newMonthlyRate, newMonthlyPayment, totalClosingCosts, TIME_HORIZON_10_YEARS);
  const costAtFullTerm = newTotalCost;

  // Generate recommendation
  const recommendationResult = generateRecommendation(
    breakEvenMonths, 
    monthlySavings, 
    interestSavings, 
    netSavings,
    refInputs.newTerm * 12,
    remainingMonths
  );

  return {
    newLoanAmount,
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
    recommendation: recommendationResult.text,
    recommendationType: recommendationResult.type,
    analysisType: recommendationResult.analysisType,
    remainingMonths
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
 * Generate recommendation based on comprehensive analysis
 */
function generateRecommendation(
  breakEvenMonths: number, 
  monthlySavings: number, 
  interestSavings: number, 
  netSavings: number,
  newTermMonths: number,
  currentRemainingMonths: number
): { text: string; type: 'excellent' | 'good' | 'marginal' | 'not-recommended'; analysisType: 'break-even' | 'time-savings' } {
  const termReductionMonths = currentRemainingMonths - newTermMonths;
  const termReductionYears = termReductionMonths / 12;
  const significantTermReduction = termReductionMonths >= 60; // 5+ years reduction
  const moderateTermReduction = termReductionMonths >= 24; // 2+ years reduction
  const significantInterestSavings = interestSavings >= 50000; // $50k+ in interest savings
  const moderateInterestSavings = interestSavings >= 20000; // $20k+ in interest savings

  // Determine analysis type - use time-savings for term reduction scenarios
  const analysisType: 'break-even' | 'time-savings' = moderateTermReduction ? 'time-savings' : 'break-even';

  // Excellent scenarios
  if (breakEvenMonths < BREAK_EVEN_EXCELLENT) {
    return {
      text: 'Excellent! You\'ll break even in less than 2 years. This refinance is highly recommended.',
      type: 'excellent',
      analysisType: 'break-even'
    };
  }
  
  // Term reduction scenarios (even with higher monthly payments) - these are excellent/good
  if (significantTermReduction && significantInterestSavings) {
    return {
      text: `Excellent for building equity! You'll pay off your loan ${termReductionYears.toFixed(1)} years earlier and save ${(interestSavings / 1000).toFixed(0)}k in interest, despite higher monthly payments.`,
      type: 'excellent',
      analysisType: 'time-savings'
    };
  }
  
  if (significantTermReduction && moderateInterestSavings) {
    return {
      text: `Good for wealth building! You'll pay off your loan ${termReductionYears.toFixed(1)} years earlier and save ${(interestSavings / 1000).toFixed(0)}k in interest. Consider if you can afford the higher payment.`,
      type: 'good',
      analysisType: 'time-savings'
    };
  }
  
  // Good scenarios with monthly savings
  if (breakEvenMonths < BREAK_EVEN_GOOD && monthlySavings > 0) {
    return {
      text: 'Good opportunity. You\'ll break even in ' + Math.round(breakEvenMonths / 12) + ' years. Worth refinancing if you plan to stay longer.',
      type: 'good',
      analysisType: 'break-even'
    };
  }
  
  if (moderateTermReduction && interestSavings > 0) {
    return {
      text: `Worth considering for faster payoff. You'll finish ${termReductionYears.toFixed(1)} years earlier and save ${(interestSavings / 1000).toFixed(0)}k in interest, but monthly payments will increase.`,
      type: 'marginal',
      analysisType: 'time-savings'
    };
  }
  
  // Marginal scenarios
  if (breakEvenMonths < BREAK_EVEN_MARGINAL && monthlySavings > 0) {
    return {
      text: 'Marginal benefit. Break-even takes ' + Math.round(breakEvenMonths / 12) + ' years. Only refinance if you\'re certain you\'ll keep the loan that long.',
      type: 'marginal',
      analysisType: 'break-even'
    };
  }
  
  // Scenarios with payment increases but no significant benefits
  if (monthlySavings < 0 && !moderateTermReduction) {
    return {
      text: 'Not recommended. Your monthly payment would increase without significant term reduction or interest savings.',
      type: 'not-recommended',
      analysisType: 'break-even'
    };
  }
  
  // Long break-even scenarios
  if (breakEvenMonths === Infinity) {
    return {
      text: 'Not recommended. Your monthly payment increases, making break-even impossible from a cash flow perspective.',
      type: 'not-recommended',
      analysisType: 'break-even'
    };
  }
  
  return {
    text: 'Not recommended. The break-even period is too long to justify the closing costs.',
    type: 'not-recommended',
    analysisType: 'break-even'
  };
}
