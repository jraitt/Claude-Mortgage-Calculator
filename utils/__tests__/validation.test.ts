/**
 * Unit tests for validation utility functions
 */

import {
  validateRefinanceInputs,
  validateMortgageInputs,
  isValidPrincipalPayment,
  validatePointsInputs,
  validatePointsScenario,
  validateExistingMortgageInputs,
} from '../validation';

describe('validateRefinanceInputs', () => {
  const validInputs = {
    currentBalance: 300000,
    currentRate: 6.5,
    currentMonthlyPayment: 1896.20,
    remainingMonths: 300,
    newRate: 5.5,
    newTerm: 30,
    closingCosts: 3000,
    cashOut: 0,
    newPoints: 0,
  };

  test('should pass with valid inputs', () => {
    const result = validateRefinanceInputs(validInputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with negative current balance', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      currentBalance: -1000,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should fail with current balance too small', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      currentBalance: 500, // Less than MIN_LOAN_AMOUNT
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('at least'))).toBe(true);
  });

  test('should fail with negative interest rate', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      currentRate: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with interest rate too high', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      newRate: 35, // Above MAX_INTEREST_RATE
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed'))).toBe(true);
  });

  test('should fail when monthly payment is too low to cover interest', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      currentRate: 10,
      currentMonthlyPayment: 100, // Way too low for $300k loan at 10%
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('too low to cover interest'))).toBe(true);
  });

  test('should fail with negative cash out', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      cashOut: -5000,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with cash out exceeding 80% of balance', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      cashOut: 250000, // More than 80% of $300k
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed 80%'))).toBe(true);
  });

  test('should fail with negative points', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      newPoints: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with negative closing costs', () => {
    const result = validateRefinanceInputs({
      ...validInputs,
      closingCosts: -1000,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });
});

describe('validateMortgageInputs', () => {
  const validInputs = {
    loanAmount: 320000,
    interestRate: 6.5,
    loanTerm: 30,
    homePrice: 400000,
    downPayment: 80000,
  };

  test('should pass with valid inputs', () => {
    const result = validateMortgageInputs(validInputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with loan amount too small', () => {
    const result = validateMortgageInputs({
      ...validInputs,
      loanAmount: 500,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should fail with negative interest rate', () => {
    const result = validateMortgageInputs({
      ...validInputs,
      interestRate: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with loan term too short', () => {
    const result = validateMortgageInputs({
      ...validInputs,
      loanTerm: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('at least'))).toBe(true);
  });

  test('should fail with down payment exceeding home price', () => {
    const result = validateMortgageInputs({
      ...validInputs,
      downPayment: 500000, // More than home price
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed home price'))).toBe(true);
  });
});

describe('isValidPrincipalPayment', () => {
  test('should return true when payment covers interest', () => {
    const monthlyPayment = 2000;
    const balance = 300000;
    const monthlyRate = 0.065 / 12; // 6.5% annual

    const result = isValidPrincipalPayment(monthlyPayment, balance, monthlyRate);
    expect(result).toBe(true);
  });

  test('should return false when payment does not cover interest', () => {
    const monthlyPayment = 100;
    const balance = 300000;
    const monthlyRate = 0.065 / 12; // 6.5% annual (interest would be ~$1625/month)

    const result = isValidPrincipalPayment(monthlyPayment, balance, monthlyRate);
    expect(result).toBe(false);
  });

  test('should return true for zero interest rate with positive payment', () => {
    const monthlyPayment = 1000;
    const balance = 300000;
    const monthlyRate = 0;

    const result = isValidPrincipalPayment(monthlyPayment, balance, monthlyRate);
    expect(result).toBe(true);
  });

  test('should return false for zero payment with positive balance', () => {
    const monthlyPayment = 0;
    const balance = 300000;
    const monthlyRate = 0;

    const result = isValidPrincipalPayment(monthlyPayment, balance, monthlyRate);
    expect(result).toBe(false);
  });
});
describe('validatePointsInputs', () => {
  const validInputs = {
    loanAmount: 320000,
    loanTerm: 30,
  };

  test('should pass with valid inputs', () => {
    const result = validatePointsInputs(validInputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with loan amount too small', () => {
    const result = validatePointsInputs({
      ...validInputs,
      loanAmount: 500, // Less than MIN_LOAN_AMOUNT
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('at least'))).toBe(true);
  });

  test('should fail with loan amount too large', () => {
    const result = validatePointsInputs({
      ...validInputs,
      loanAmount: 200000000, // More than MAX_LOAN_AMOUNT
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed'))).toBe(true);
  });

  test('should fail with loan term too short', () => {
    const result = validatePointsInputs({
      ...validInputs,
      loanTerm: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('at least'))).toBe(true);
  });

  test('should fail with loan term too long', () => {
    const result = validatePointsInputs({
      ...validInputs,
      loanTerm: 60, // More than MAX_LOAN_TERM
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed'))).toBe(true);
  });
});

describe('validatePointsScenario', () => {
  const validScenario = {
    name: 'Scenario 1',
    rate: 6.5,
    points: 1.0,
  };

  test('should pass with valid scenario', () => {
    const result = validatePointsScenario(validScenario);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with empty scenario name', () => {
    const result = validatePointsScenario({
      ...validScenario,
      name: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be empty'))).toBe(true);
  });

  test('should fail with scenario name too long', () => {
    const result = validatePointsScenario({
      ...validScenario,
      name: 'A'.repeat(60), // More than 50 characters
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed 50 characters'))).toBe(true);
  });

  test('should fail with negative interest rate', () => {
    const result = validatePointsScenario({
      ...validScenario,
      rate: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with interest rate too high', () => {
    const result = validatePointsScenario({
      ...validScenario,
      rate: 35, // Above MAX_INTEREST_RATE
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed'))).toBe(true);
  });

  test('should fail with negative points', () => {
    const result = validatePointsScenario({
      ...validScenario,
      points: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with points too high', () => {
    const result = validatePointsScenario({
      ...validScenario,
      points: 15, // Above MAX_POINTS
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed'))).toBe(true);
  });
});

describe('validateExistingMortgageInputs', () => {
  const validInputs = {
    originalPrincipal: 400000,
    currentBalance: 320000,
    paymentsMade: 60,
    loanTerm: 30,
    interestRate: 6.5,
    extraMonthlyPrincipal: 200,
    extraAnnualPayment: 5000,
  };

  test('should pass with valid inputs', () => {
    const result = validateExistingMortgageInputs(validInputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with original principal too small', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      originalPrincipal: 500, // Less than MIN_LOAN_AMOUNT
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('at least'))).toBe(true);
  });

  test('should fail with negative current balance', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      currentBalance: -1000,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with current balance exceeding original principal', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      currentBalance: 500000, // More than original principal
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed original principal'))).toBe(true);
  });

  test('should fail with negative payments made', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      paymentsMade: -5,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with payments made exceeding total payments', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      paymentsMade: 400, // More than 30 years * 12 months = 360
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed total loan payments'))).toBe(true);
  });

  test('should fail with negative interest rate', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      interestRate: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with negative extra monthly principal', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      extraMonthlyPrincipal: -100,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with negative extra annual payment', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      extraAnnualPayment: -1000,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot be negative'))).toBe(true);
  });

  test('should fail with extra monthly principal exceeding balance', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      extraMonthlyPrincipal: 400000, // More than current balance
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed current balance'))).toBe(true);
  });

  test('should fail with extra annual payment exceeding balance', () => {
    const result = validateExistingMortgageInputs({
      ...validInputs,
      extraAnnualPayment: 400000, // More than current balance
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('cannot exceed current balance'))).toBe(true);
  });

  test('should pass with undefined extra payments', () => {
    const result = validateExistingMortgageInputs({
      originalPrincipal: 400000,
      currentBalance: 320000,
      paymentsMade: 60,
      loanTerm: 30,
      interestRate: 6.5,
      // extraMonthlyPrincipal and extraAnnualPayment are undefined
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});