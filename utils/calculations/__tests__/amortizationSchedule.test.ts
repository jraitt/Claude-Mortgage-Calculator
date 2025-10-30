/**
 * Unit tests for amortization schedule generation
 */

import {
  generateAmortizationSchedule,
  ScheduleEntry,
} from '../amortizationSchedule';
import { MortgageInputs } from '../../../components/MortgageCalculator';

describe('generateAmortizationSchedule', () => {
  const defaultInputs: MortgageInputs = {
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    isExistingLoan: false,
  } as MortgageInputs;

  test('should generate correct schedule for standard mortgage', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0, // escrow
      0, // PMI
      defaultInputs
    );

    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule[0].month).toBe(1);
    expect(schedule[0].balance).toBeLessThan(loanAmount);
    // Final balance should be very close to 0 (within $10)
    expect(schedule[schedule.length - 1].balance).toBeLessThan(10);
  });

  test('should handle zero interest rate', () => {
    const loanAmount = 120000;
    const monthlyRate = 0;
    const monthlyPI = 1000; // 120000 / 120
    const totalPayments = 10 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs
    );

    expect(schedule).toHaveLength(120);
    expect(schedule[0].principal).toBe(1000);
    expect(schedule[0].interest).toBe(0);
  });

  test('should include PMI in payments', () => {
    const loanAmount = 320000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 2021.15;
    const totalPayments = 30 * 12;
    const monthlyPMI = 150;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      monthlyPMI,
      defaultInputs
    );

    expect(schedule[0].pmi).toBeGreaterThan(0);
    // Payment field only includes P&I + extra principal, not PMI
    expect(schedule[0].payment).toBe(monthlyPI);
  });

  test('should include escrow in payments', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    const monthlyEscrow = 500;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      monthlyEscrow,
      0,
      defaultInputs
    );

    expect(schedule[0].escrow).toBe(500);
    // Payment field only includes P&I + extra principal, not escrow
    expect(schedule[0].payment).toBe(monthlyPI);
  });

  test('should handle extra monthly principal', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    const extraMonthly = 200;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs,
      extraMonthly
    );

    expect(schedule[0].extraPrincipal).toBe(200);
    expect(schedule.length).toBeLessThan(totalPayments); // Should pay off faster
  });

  test('should handle bi-weekly payments', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs,
      0, // extraMonthly
      false, // doubleMonthly
      0, // extraAnnual
      true // biWeekly
    );

    expect(schedule.length).toBeLessThan(totalPayments); // Should pay off faster
  });
});

describe('generateAmortizationSchedule with strategies', () => {
  const defaultInputs: MortgageInputs = {
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    isExistingLoan: false,
  } as MortgageInputs;

  test('should handle double monthly principal', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs,
      0, // extraMonthly
      true // doubleMonthly
    );

    expect(schedule[0].extraPrincipal).toBeGreaterThan(0);
    // Should pay off faster, but not necessarily less than half the time
    expect(schedule.length).toBeLessThan(totalPayments);
  });

  test('should handle extra annual payments', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    const extraAnnual = 5000;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs,
      0, // extraMonthly
      false, // doubleMonthly
      extraAnnual
    );

    expect(schedule.length).toBeLessThan(totalPayments);
    
    // Check December payments (month 12, 24, etc.)
    const decemberPayments = schedule.filter(entry => entry.month % 12 === 0);
    if (decemberPayments.length > 0) {
      expect(decemberPayments[0].extraPrincipal).toBe(5000);
    }
  });

  test('should accumulate total interest correctly', () => {
    const loanAmount = 100000;
    const monthlyRate = 5 / 100 / 12;
    const monthlyPI = 536.82;
    const totalPayments = 15 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs
    );

    expect(schedule[0].totalInterest).toBeCloseTo(schedule[0].interest, 2);
    if (schedule.length > 1) {
      expect(schedule[1].totalInterest).toBeCloseTo(
        schedule[0].interest + schedule[1].interest,
        2
      );
    }
    expect(schedule[schedule.length - 1].totalInterest).toBeGreaterThan(0);
  });

  test('should handle combination of extra payments', () => {
    const loanAmount = 300000;
    const monthlyRate = 6.5 / 100 / 12;
    const monthlyPI = 1896.20;
    const totalPayments = 30 * 12;
    
    const schedule = generateAmortizationSchedule(
      loanAmount,
      monthlyRate,
      monthlyPI,
      totalPayments,
      0,
      0,
      defaultInputs,
      100, // extraMonthly
      false, // doubleMonthly
      2000 // extraAnnual
    );

    expect(schedule.length).toBeLessThan(totalPayments);
    expect(schedule[0].extraPrincipal).toBe(100);
    
    // December should have both extra monthly and annual
    const decemberPayments = schedule.filter(entry => entry.month % 12 === 0);
    if (decemberPayments.length > 0) {
      expect(decemberPayments[0].extraPrincipal).toBe(2100); // 100 + 2000
    }
  });
});