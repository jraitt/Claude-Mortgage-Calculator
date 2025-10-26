/**
 * Basic mortgage calculation utilities
 * Handles core calculations: loan amount, payment, PMI, escrow, LTV
 */

import { MortgageInputs } from '../../components/MortgageCalculator';
import { PMI_LTV_THRESHOLD } from '../constants';

/**
 * Calculate the loan amount (principal)
 */
export function calculateLoanAmount(inputs: MortgageInputs): number {
  return inputs.isExistingLoan ? inputs.currentBalance : inputs.homePrice - inputs.downPayment;
}

/**
 * Calculate monthly interest rate (annual rate / 100 / 12)
 */
export function calculateMonthlyRate(annualRate: number): number {
  return (annualRate || 0) / 100 / 12;
}

/**
 * Calculate monthly principal and interest payment
 * Handles both standard rates and zero interest rate edge case
 */
export function calculateMonthlyPI(
  loanAmount: number,
  monthlyRate: number,
  totalPayments: number
): number {
  if (monthlyRate === 0) {
    return loanAmount / totalPayments;
  }

  const power = Math.pow(1 + monthlyRate, totalPayments);
  return (loanAmount * (monthlyRate * power)) / (power - 1);
}

/**
 * Calculate loan-to-value (LTV) ratio as a percentage
 */
export function calculateLTVRatio(inputs: MortgageInputs, loanAmount: number): number {
  if (inputs.isExistingLoan) {
    return 0; // LTV not applicable for existing loans
  }

  return inputs.homePrice > 0
    ? (loanAmount / inputs.homePrice) * 100
    : 0;
}

/**
 * Calculate monthly PMI payment
 * PMI is removed when LTV reaches 78%
 */
export function calculateMonthlyPMI(
  inputs: MortgageInputs,
  loanAmount: number,
  ltvRatio: number
): number {
  if (inputs.isExistingLoan) {
    return inputs.pmiAmount || 0;
  }

  if (ltvRatio > PMI_LTV_THRESHOLD) {
    return (loanAmount * ((inputs.pmiRate || 0) / 100)) / 12;
  }

  return 0;
}

/**
 * Calculate monthly escrow (property taxes + home insurance)
 */
export function calculateMonthlyEscrow(inputs: MortgageInputs): number {
  if (inputs.isExistingLoan) {
    return 0;
  }

  return ((inputs.propertyTax || 0) + (inputs.homeInsurance || 0)) / 12;
}

/**
 * Calculate total monthly payment (P&I + PMI + Escrow)
 */
export function calculateTotalMonthlyPayment(
  monthlyPI: number,
  monthlyPMI: number,
  monthlyEscrow: number
): number {
  return monthlyPI + monthlyPMI + monthlyEscrow;
}

/**
 * Calculate all basic loan metrics at once
 * Useful for getting all basic calculations in one call
 */
export function calculateBasicMetrics(inputs: MortgageInputs) {
  const loanAmount = calculateLoanAmount(inputs);
  const monthlyRate = calculateMonthlyRate(inputs.interestRate);
  // Total payments is calculated in useBasicMetrics hook now
  const totalPayments = inputs.loanTerm * 12;
  const monthlyPI = calculateMonthlyPI(loanAmount, monthlyRate, totalPayments);
  const ltvRatio = calculateLTVRatio(inputs, loanAmount);
  const monthlyPMI = calculateMonthlyPMI(inputs, loanAmount, ltvRatio);
  const monthlyEscrow = calculateMonthlyEscrow(inputs);
  const totalMonthlyPayment = calculateTotalMonthlyPayment(monthlyPI, monthlyPMI, monthlyEscrow);

  return {
    loanAmount,
    monthlyRate,
    totalPayments,
    monthlyPI,
    ltvRatio,
    monthlyPMI,
    monthlyEscrow,
    totalMonthlyPayment
  };
}
