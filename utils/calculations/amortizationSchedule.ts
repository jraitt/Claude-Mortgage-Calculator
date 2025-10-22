/**
 * Amortization schedule calculation utilities
 * Generates month-by-month payment breakdowns with support for various paydown strategies
 */

import { MortgageInputs } from '../../components/MortgageCalculator';
import { BIWEEKLY_PERIODS_PER_YEAR, MINIMUM_BALANCE, MAX_ITERATIONS, PMI_LTV_THRESHOLD } from '../constants';

export interface ScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  extraPrincipal: number;
  balance: number;
  totalInterest: number;
  pmi: number;
  escrow: number;
}

/**
 * Generate amortization schedule with support for paydown strategies
 * @param loanAmount - Principal amount
 * @param monthlyRate - Monthly interest rate (annual rate / 100 / 12)
 * @param monthlyPI - Monthly principal and interest payment
 * @param totalPayments - Total number of payments
 * @param monthlyEscrow - Monthly escrow (taxes + insurance)
 * @param monthlyPMI - Monthly PMI payment
 * @param inputs - Original mortgage inputs (for LTV calculations)
 * @param extraMonthly - Extra principal payment each month
 * @param doubleMonthly - Whether to double the principal portion of payment
 * @param extraAnnual - Extra principal payment annually
 * @param biWeekly - Whether to use bi-weekly payments
 */
export function generateAmortizationSchedule(
  loanAmount: number,
  monthlyRate: number,
  monthlyPI: number,
  totalPayments: number,
  monthlyEscrow: number,
  monthlyPMI: number,
  inputs: MortgageInputs,
  extraMonthly = 0,
  doubleMonthly = false,
  extraAnnual = 0,
  biWeekly = false
): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  let remainingBalance = loanAmount;
  let totalInterestPaid = 0;

  if (biWeekly) {
    return generateBiWeeklySchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      monthlyEscrow,
      monthlyPMI,
      inputs
    );
  }

  // Standard monthly payments
  const maxMonths = Math.min(totalPayments, MAX_ITERATIONS);

  for (let month = 1; month <= maxMonths && remainingBalance > MINIMUM_BALANCE; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPI - interestPayment;

    // Safety check: prevent negative principal payments
    if (principalPayment <= 0) {
      console.warn('Monthly payment too low to cover interest. Stopping amortization.');
      break;
    }

    // Add extra payments
    let extraPrincipal = extraMonthly;
    if (doubleMonthly) {
      extraPrincipal += principalPayment;
    }
    if (month % 12 === 0) {
      extraPrincipal += extraAnnual;
    }

    // Don't pay more than remaining balance
    const totalPrincipal = Math.min(principalPayment + extraPrincipal, remainingBalance);

    remainingBalance -= totalPrincipal;
    totalInterestPaid += interestPayment;

    // Calculate PMI based on updated LTV
    const currentLTV = inputs.isExistingLoan
      ? (remainingBalance / inputs.originalPrincipal) * 100
      : (remainingBalance / inputs.homePrice) * 100;
    const pmiPayment = inputs.isExistingLoan
      ? (remainingBalance > 0 ? monthlyPMI : 0)
      : (currentLTV > PMI_LTV_THRESHOLD ? monthlyPMI : 0);

    schedule.push({
      month,
      payment: monthlyPI + extraPrincipal,
      principal: totalPrincipal,
      interest: interestPayment,
      extraPrincipal,
      balance: remainingBalance,
      totalInterest: totalInterestPaid,
      pmi: pmiPayment,
      escrow: monthlyEscrow
    });
  }

  return schedule;
}

/**
 * Generate bi-weekly payment schedule
 * 26 bi-weekly payments per year = 13 monthly-equivalent payments
 */
function generateBiWeeklySchedule(
  loanAmount: number,
  monthlyRate: number,
  monthlyPI: number,
  totalPayments: number,
  monthlyEscrow: number,
  monthlyPMI: number,
  inputs: MortgageInputs
): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  let remainingBalance = loanAmount;
  let totalInterestPaid = 0;

  const biWeeklyPayment = monthlyPI / 2;
  const biWeeklyRate = inputs.interestRate / 100 / BIWEEKLY_PERIODS_PER_YEAR;
  let paymentNumber = 1;
  const maxPayments = Math.min(totalPayments * 2, MAX_ITERATIONS);

  while (remainingBalance > MINIMUM_BALANCE && paymentNumber <= maxPayments) {
    const interestPayment = remainingBalance * biWeeklyRate;
    let principalPayment = biWeeklyPayment - interestPayment;

    // Safety check: prevent negative principal payments
    if (principalPayment <= 0) {
      console.warn('Bi-weekly payment too low to cover interest. Stopping amortization.');
      break;
    }

    // Don't pay more than remaining balance
    principalPayment = Math.min(principalPayment, remainingBalance);

    remainingBalance -= principalPayment;
    totalInterestPaid += interestPayment;

    // Add to schedule every 2 payments (monthly equivalent)
    if (paymentNumber % 2 === 0) {
      const currentLTV = inputs.isExistingLoan
        ? (remainingBalance / inputs.originalPrincipal) * 100
        : (remainingBalance / inputs.homePrice) * 100;
      const pmiPayment = inputs.isExistingLoan
        ? (remainingBalance > 0 ? monthlyPMI : 0)
        : (currentLTV > PMI_LTV_THRESHOLD ? monthlyPMI : 0);

      schedule.push({
        month: Math.ceil(paymentNumber / 2),
        payment: biWeeklyPayment * 2,
        principal: principalPayment * 2, // Approximate for display
        interest: interestPayment * 2, // Approximate for display
        extraPrincipal: 0,
        balance: remainingBalance,
        totalInterest: totalInterestPaid,
        pmi: pmiPayment,
        escrow: monthlyEscrow
      });
    }

    paymentNumber++;
  }

  return schedule;
}
