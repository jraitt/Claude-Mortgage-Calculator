// Input Validation Utilities

import {
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_LOAN_TERM,
  MAX_LOAN_TERM,
  MIN_CLOSING_COSTS,
  MAX_CLOSING_COSTS,
  MAX_POINTS,
  MIN_REMAINING_MONTHS,
  MAX_REMAINING_MONTHS,
} from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates refinance calculator inputs
 */
export function validateRefinanceInputs(inputs: {
  currentBalance: number;
  currentRate: number;
  currentMonthlyPayment: number;
  remainingMonths: number;
  newRate: number;
  newTerm: number;
  closingCosts: number;
  cashOut: number;
  newPoints: number;
}): ValidationResult {
  const errors: string[] = [];

  // Current balance validation
  if (inputs.currentBalance < MIN_LOAN_AMOUNT) {
    errors.push(`Current balance must be at least $${MIN_LOAN_AMOUNT.toLocaleString()}`);
  }
  if (inputs.currentBalance > MAX_LOAN_AMOUNT) {
    errors.push(`Current balance cannot exceed $${MAX_LOAN_AMOUNT.toLocaleString()}`);
  }

  // Current rate validation
  if (inputs.currentRate < MIN_INTEREST_RATE) {
    errors.push(`Current interest rate cannot be negative`);
  }
  if (inputs.currentRate > MAX_INTEREST_RATE) {
    errors.push(`Current interest rate cannot exceed ${MAX_INTEREST_RATE}%`);
  }

  // Current monthly payment validation
  if (inputs.currentMonthlyPayment <= 0) {
    errors.push('Current monthly payment must be greater than $0');
  }
  if (inputs.currentMonthlyPayment > inputs.currentBalance) {
    errors.push('Current monthly payment cannot exceed current balance');
  }

  // Validate that payment can cover interest (prevent negative principal)
  const currentMonthlyRate = inputs.currentRate / 100 / 12;
  const minRequiredPayment = inputs.currentBalance * currentMonthlyRate;
  if (inputs.currentMonthlyPayment < minRequiredPayment * 0.99) { // Allow 1% margin for rounding
    errors.push(
      `Current monthly payment ($${inputs.currentMonthlyPayment.toFixed(2)}) is too low to cover interest ` +
      `($${minRequiredPayment.toFixed(2)}). This would cause the loan balance to grow instead of decrease.`
    );
  }

  // Remaining months validation
  if (inputs.remainingMonths < MIN_REMAINING_MONTHS) {
    errors.push(`Remaining months must be at least ${MIN_REMAINING_MONTHS}`);
  }
  if (inputs.remainingMonths > MAX_REMAINING_MONTHS) {
    errors.push(`Remaining months cannot exceed ${MAX_REMAINING_MONTHS} (${MAX_REMAINING_MONTHS / 12} years)`);
  }

  // New rate validation
  if (inputs.newRate < MIN_INTEREST_RATE) {
    errors.push(`New interest rate cannot be negative`);
  }
  if (inputs.newRate > MAX_INTEREST_RATE) {
    errors.push(`New interest rate cannot exceed ${MAX_INTEREST_RATE}%`);
  }

  // New term validation
  if (inputs.newTerm < MIN_LOAN_TERM) {
    errors.push(`New loan term must be at least ${MIN_LOAN_TERM} year`);
  }
  if (inputs.newTerm > MAX_LOAN_TERM) {
    errors.push(`New loan term cannot exceed ${MAX_LOAN_TERM} years`);
  }

  // Closing costs validation
  if (inputs.closingCosts < MIN_CLOSING_COSTS) {
    errors.push(`Closing costs cannot be negative`);
  }
  if (inputs.closingCosts > MAX_CLOSING_COSTS) {
    errors.push(`Closing costs cannot exceed $${MAX_CLOSING_COSTS.toLocaleString()}`);
  }

  // Cash out validation
  if (inputs.cashOut < 0) {
    errors.push('Cash out amount cannot be negative');
  }
  if (inputs.cashOut > inputs.currentBalance * 0.8) {
    errors.push('Cash out amount cannot exceed 80% of current balance (typical lending limit)');
  }

  // Points validation
  if (inputs.newPoints < 0) {
    errors.push('Points cannot be negative');
  }
  if (inputs.newPoints > MAX_POINTS) {
    errors.push(`Points cannot exceed ${MAX_POINTS}%`);
  }

  // Validate new loan payment can cover interest
  const pointsCost = inputs.currentBalance * (inputs.newPoints / 100);
  const newLoanAmount = inputs.currentBalance + inputs.cashOut + pointsCost;
  const newMonthlyRate = inputs.newRate / 100 / 12;
  const newTotalPayments = inputs.newTerm * 12;

  if (newMonthlyRate > 0 && newLoanAmount > 0 && newTotalPayments > 0) {
    const calculatedPayment =
      newLoanAmount * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newTotalPayments)) /
      (Math.pow(1 + newMonthlyRate, newTotalPayments) - 1);

    const minNewPayment = newLoanAmount * newMonthlyRate;
    if (calculatedPayment < minNewPayment * 0.99) { // Allow 1% margin for rounding
      errors.push(
        `The new loan terms would result in negative principal payments. ` +
        `Please adjust the interest rate, loan amount, or term.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates mortgage calculator inputs
 */
export function validateMortgageInputs(inputs: {
  homePrice?: number;
  downPayment?: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}): ValidationResult {
  const errors: string[] = [];

  // Loan amount validation
  if (inputs.loanAmount < MIN_LOAN_AMOUNT) {
    errors.push(`Loan amount must be at least $${MIN_LOAN_AMOUNT.toLocaleString()}`);
  }
  if (inputs.loanAmount > MAX_LOAN_AMOUNT) {
    errors.push(`Loan amount cannot exceed $${MAX_LOAN_AMOUNT.toLocaleString()}`);
  }

  // Interest rate validation
  if (inputs.interestRate < MIN_INTEREST_RATE) {
    errors.push(`Interest rate cannot be negative`);
  }
  if (inputs.interestRate > MAX_INTEREST_RATE) {
    errors.push(`Interest rate cannot exceed ${MAX_INTEREST_RATE}%`);
  }

  // Loan term validation
  if (inputs.loanTerm < MIN_LOAN_TERM) {
    errors.push(`Loan term must be at least ${MIN_LOAN_TERM} year`);
  }
  if (inputs.loanTerm > MAX_LOAN_TERM) {
    errors.push(`Loan term cannot exceed ${MAX_LOAN_TERM} years`);
  }

  // Home price and down payment validation (if provided)
  if (inputs.homePrice !== undefined && inputs.downPayment !== undefined) {
    if (inputs.homePrice <= 0) {
      errors.push('Home price must be greater than $0');
    }
    if (inputs.downPayment < 0) {
      errors.push('Down payment cannot be negative');
    }
    if (inputs.downPayment > inputs.homePrice) {
      errors.push('Down payment cannot exceed home price');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a principal payment would be negative or cause an infinite loop
 */
export function isValidPrincipalPayment(
  monthlyPayment: number,
  balance: number,
  monthlyRate: number
): boolean {
  if (monthlyRate === 0) {
    return monthlyPayment > 0 && balance > 0;
  }

  const interestPayment = balance * monthlyRate;
  const principalPayment = monthlyPayment - interestPayment;

  // Principal must be positive for the loan to be paid off
  return principalPayment > 0;
}
