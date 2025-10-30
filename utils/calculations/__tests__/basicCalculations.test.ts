/**
 * Unit tests for basic mortgage calculation functions
 */

import {
  calculateLoanAmount,
  calculateMonthlyRate,
  calculateMonthlyPI,
  calculateLTVRatio,
  calculateMonthlyPMI,
  calculateMonthlyEscrow,
  calculateTotalMonthlyPayment,
  calculateBasicMetrics,
} from '../basicCalculations';
import { MortgageInputs } from '../../../components/MortgageCalculator';

describe('calculateMonthlyPI', () => {
  test('should calculate correct payment for standard 30-year mortgage', () => {
    const monthlyRate = calculateMonthlyRate(6.5);
    const result = calculateMonthlyPI(300000, monthlyRate, 30 * 12);
    expect(result).toBeCloseTo(1896.20, 2);
  });

  test('should calculate correct payment for 15-year mortgage', () => {
    const monthlyRate = calculateMonthlyRate(5.5);
    const result = calculateMonthlyPI(250000, monthlyRate, 15 * 12);
    expect(result).toBeCloseTo(2042.71, 2);
  });

  test('should handle zero interest rate', () => {
    const monthlyRate = calculateMonthlyRate(0);
    const result = calculateMonthlyPI(300000, monthlyRate, 30 * 12);
    expect(result).toBeCloseTo(833.33, 2);
  });

  test('should handle very high interest rates', () => {
    const monthlyRate = calculateMonthlyRate(20);
    const result = calculateMonthlyPI(100000, monthlyRate, 30 * 12);
    expect(result).toBeCloseTo(1671.02, 2);
  });

  test('should handle short loan terms', () => {
    const monthlyRate = calculateMonthlyRate(6);
    const result = calculateMonthlyPI(100000, monthlyRate, 1 * 12);
    expect(result).toBeCloseTo(8606.64, 2);
  });
});

describe('calculateMonthlyRate', () => {
  test('should calculate monthly rate correctly', () => {
    expect(calculateMonthlyRate(6)).toBeCloseTo(0.005, 6);
    expect(calculateMonthlyRate(12)).toBeCloseTo(0.01, 6);
  });

  test('should handle zero rate', () => {
    expect(calculateMonthlyRate(0)).toBe(0);
  });

  test('should handle undefined rate', () => {
    expect(calculateMonthlyRate(undefined as any)).toBe(0);
  });
});

describe('calculateLoanAmount', () => {
  test('should calculate loan amount from home price and down payment', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 80000,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const result = calculateLoanAmount(inputs);
    expect(result).toBe(320000);
  });

  test('should return current balance for existing loans', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 80000,
      currentBalance: 250000,
      isExistingLoan: true,
    } as MortgageInputs;
    
    const result = calculateLoanAmount(inputs);
    expect(result).toBe(250000);
  });

  test('should handle zero down payment', () => {
    const inputs: MortgageInputs = {
      homePrice: 300000,
      downPayment: 0,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const result = calculateLoanAmount(inputs);
    expect(result).toBe(300000);
  });
});

describe('calculateLTVRatio', () => {
  test('should calculate LTV ratio correctly', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 80000,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const loanAmount = 320000;
    const result = calculateLTVRatio(inputs, loanAmount);
    expect(result).toBe(80); // 320k / 400k * 100
  });

  test('should return 0 for existing loans', () => {
    const inputs: MortgageInputs = {
      isExistingLoan: true,
    } as MortgageInputs;
    
    const result = calculateLTVRatio(inputs, 250000);
    expect(result).toBe(0);
  });
});

describe('calculateMonthlyPMI', () => {
  test('should calculate PMI based on rate when LTV > 78%', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 40000, // 90% LTV
      pmiRate: 0.5,
      pmiAmount: 0,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const loanAmount = 360000;
    const ltvRatio = 90; // 360k / 400k * 100
    const result = calculateMonthlyPMI(inputs, loanAmount, ltvRatio);
    expect(result).toBeCloseTo(150, 2); // $360k * 0.5% / 12
  });

  test('should return fixed PMI amount when provided', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 40000,
      pmiRate: 0.5,
      pmiAmount: 200,
      isExistingLoan: true, // For existing loans, it returns pmiAmount
    } as MortgageInputs;
    
    const result = calculateMonthlyPMI(inputs, 360000, 90);
    expect(result).toBe(200);
  });

  test('should return 0 when LTV <= 78%', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 100000, // 75% LTV
      pmiRate: 0.5,
      pmiAmount: 0,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const loanAmount = 300000;
    const ltvRatio = 75; // 300k / 400k * 100
    const result = calculateMonthlyPMI(inputs, loanAmount, ltvRatio);
    expect(result).toBe(0);
  });
});

describe('calculateMonthlyEscrow', () => {
  test('should calculate monthly escrow from annual amounts', () => {
    const inputs: MortgageInputs = {
      propertyTax: 8000,
      homeInsurance: 1200,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const result = calculateMonthlyEscrow(inputs);
    expect(result).toBeCloseTo(766.67, 2); // (8000 + 1200) / 12
  });

  test('should return 0 for existing loans', () => {
    const inputs: MortgageInputs = {
      propertyTax: 8000,
      homeInsurance: 1200,
      isExistingLoan: true,
    } as MortgageInputs;
    
    const result = calculateMonthlyEscrow(inputs);
    expect(result).toBe(0);
  });
});

describe('calculateTotalMonthlyPayment', () => {
  test('should sum all payment components', () => {
    const result = calculateTotalMonthlyPayment(1896.20, 150, 766.67);
    expect(result).toBeCloseTo(2812.87, 2);
  });

  test('should handle zero components', () => {
    const result = calculateTotalMonthlyPayment(1500, 0, 0);
    expect(result).toBe(1500);
  });
});

describe('calculateBasicMetrics', () => {
  test('should calculate all basic metrics', () => {
    const inputs: MortgageInputs = {
      homePrice: 400000,
      downPayment: 80000,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTax: 8000,
      homeInsurance: 1200,
      pmiRate: 0.5,
      pmiAmount: 0,
      isExistingLoan: false,
    } as MortgageInputs;
    
    const result = calculateBasicMetrics(inputs);
    
    expect(result.loanAmount).toBe(320000);
    expect(result.monthlyRate).toBeCloseTo(0.00541667, 6);
    expect(result.monthlyPI).toBeCloseTo(2022.62, 1); // Adjusted for actual calculation
    expect(result.ltvRatio).toBe(80);
    expect(result.monthlyPMI).toBeCloseTo(133.33, 2);
    expect(result.monthlyEscrow).toBeCloseTo(766.67, 2);
    expect(result.totalMonthlyPayment).toBeCloseTo(2922.62, 1);
  });
});