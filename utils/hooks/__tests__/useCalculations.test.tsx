import { renderHook } from '@testing-library/react';
import { useBasicMetrics, usePointsComparison } from '../useCalculations';
import type { MortgageInputs, PointsScenario } from '../../../components/MortgageCalculator';

const baseInputs: MortgageInputs = {
  homePrice: 400000,
  downPayment: 80000,
  loanTerm: 30,
  interestRate: 6.5,
  propertyTax: 6000,
  homeInsurance: 1200,
  pmiRate: 0.5,
  pmiAmount: 0,
  extraMonthlyPrincipal: 0,
  doubleMonthlyPrincipal: false,
  extraAnnualPayment: 0,
  biWeeklyPayments: false,
  isExistingLoan: false,
  loanStartDate: '2024-01-01',
  originalPrincipal: 320000,
  currentBalance: 320000,
  paymentsMade: 0,
};

describe('useBasicMetrics', () => {
  it('calculates core mortgage values for standard loan', () => {
    const { result } = renderHook(() => useBasicMetrics(baseInputs));
    const metrics = result.current;

    expect(metrics.loanAmount).toBe(320000);
    expect(metrics.totalPayments).toBe(360);
    expect(metrics.monthlyPI).toBeCloseTo(2022.62, 2);
    expect(metrics.monthlyPMI).toBeGreaterThan(0);
    expect(metrics.totalMonthlyPayment).toBeCloseTo(
      metrics.monthlyPI + metrics.monthlyPMI + metrics.monthlyEscrow,
      2
    );
  });

  it('handles zero-interest edge case', () => {
    const interestFree: MortgageInputs = { ...baseInputs, interestRate: 0 };
    const { result } = renderHook(() => useBasicMetrics(interestFree));

    expect(result.current.monthlyPI).toBeCloseTo(320000 / 360, 5);
    expect(result.current.monthlyRate).toBe(0);
  });

  it('uses PMI amount for existing loans', () => {
    const existingLoan: MortgageInputs = {
      ...baseInputs,
      isExistingLoan: true,
      currentBalance: 250000,
      paymentsMade: 60,
      pmiAmount: 250,
    };

    const { result } = renderHook(() => useBasicMetrics(existingLoan));

    expect(result.current.loanAmount).toBe(250000);
    expect(result.current.monthlyPMI).toBe(250);
  });
});

describe('usePointsComparison', () => {
  const scenarios: PointsScenario[] = [
    { id: 'a', name: 'Baseline', rate: 6.5, points: 0, isBaseline: true },
    { id: 'b', name: 'Buy Points', rate: 6.0, points: 1, isBaseline: false },
  ];

  it('returns comparison data with break-even months', () => {
    const { result } = renderHook(() => usePointsComparison(scenarios, 320000, 30));
    const [baseline, discounted] = result.current;

    expect(baseline.scenario.id).toBe('a');
    expect(discounted.breakEvenMonths).toBeGreaterThan(0);
    expect(discounted.monthlySavings).toBeGreaterThan(0);
  });

  it('returns empty array without baseline scenario', () => {
    const { result } = renderHook(() =>
      usePointsComparison([{ ...scenarios[1], isBaseline: false }], 320000, 30)
    );

    expect(result.current).toEqual([]);
  });
});
