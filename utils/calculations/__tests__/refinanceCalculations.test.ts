/**
 * Unit tests for refinance calculation functions
 */

import {
  calculateRefinanceAnalysis,
} from '../refinanceCalculations';
import { RefinanceInputs, RefinanceResult } from '../../../components/MortgageCalculator';

// Helper function to calculate monthly payment (since it's not exported)
function calculateMonthlyPayment(loanAmount: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  if (monthlyRate === 0) {
    return loanAmount / totalPayments;
  }

  return (
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1)
  );
}

describe('calculateRefinanceAnalysis', () => {
  const validInputs = {
    currentBalance: 300000,
    currentRate: 7.0,
    currentMonthlyPayment: 1996.27,
    remainingMonths: 300,
    newRate: 6.0,
    newTerm: 30,
    closingCosts: 3000,
    cashOut: 0,
    newPoints: 0,
  };

  test('should perform complete refinance analysis', () => {
    const result = calculateRefinanceAnalysis(validInputs);

    expect(result.newMonthlyPayment).toBeGreaterThan(0);
    expect(result.monthlySavings).toBeGreaterThan(0);
    expect(result.totalClosingCosts).toBe(3000);
    expect(result.breakEvenMonths).toBeGreaterThan(0);
    expect(result.breakEvenMonths).toBeLessThan(100);
    expect(result.interestSavings).toBeGreaterThan(0);
    expect(result.netSavings).toBeGreaterThan(0);
    expect(result.recommendation).toContain('refinance');
  });

  test('should handle cash-out refinancing', () => {
    const cashOutInputs = { ...validInputs, cashOut: 25000 };
    const result = calculateRefinanceAnalysis(cashOutInputs);

    expect(result.newMonthlyPayment).toBeGreaterThan(validInputs.currentMonthlyPayment);
    expect(result.totalClosingCosts).toBe(3000); // Closing costs unchanged
  });

  test('should handle points in new loan', () => {
    const pointsInputs = { ...validInputs, newPoints: 1.0, newRate: 5.75 };
    const result = calculateRefinanceAnalysis(pointsInputs);

    expect(result.totalClosingCosts).toBeGreaterThan(3000); // Should include points cost
    expect(result.newMonthlyPayment).toBeLessThan(validInputs.currentMonthlyPayment);
  });

  test('should handle scenario where refinancing is not beneficial', () => {
    const badInputs = {
      ...validInputs,
      newRate: 8.0, // Higher rate
      closingCosts: 10000, // High closing costs
    };
    
    const result = calculateRefinanceAnalysis(badInputs);

    expect(result.monthlySavings).toBeLessThan(0);
    expect(result.breakEvenMonths).toBe(Infinity);
    expect(result.recommendation).toContain('not recommended');
  });

  test('should handle very short remaining term', () => {
    const shortTermInputs = { ...validInputs, remainingMonths: 24 };
    const result = calculateRefinanceAnalysis(shortTermInputs);

    expect(result.newMonthlyPayment).toBeGreaterThan(0);
    expect(result.breakEvenMonths).toBeGreaterThan(0);
  });

  test('should calculate interest savings correctly', () => {
    const result = calculateRefinanceAnalysis(validInputs);

    expect(result.currentTotalInterest).toBeGreaterThan(0);
    expect(result.newTotalInterest).toBeGreaterThan(0);
    expect(result.interestSavings).toBe(
      result.currentTotalInterest - result.newTotalInterest
    );
  });
});