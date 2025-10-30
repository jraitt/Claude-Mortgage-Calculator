/**
 * Unit tests for points calculation functions
 */

import {
  calculateScenarioMetrics,
  calculateBreakEven,
  calculateComparisonResults,
} from '../pointsCalculations';
import { PointsScenario, ComparisonResult } from '../../../components/MortgageCalculator';

describe('calculateScenarioMetrics', () => {
  const scenario: PointsScenario = {
    id: '1',
    name: 'Test Scenario',
    rate: 6.5,
    points: 1.0,
    isBaseline: false,
  };

  test('should calculate scenario metrics correctly', () => {
    const result = calculateScenarioMetrics(scenario, 300000, 30);

    expect(result.scenario).toBe(scenario);
    expect(result.monthlyPI).toBeCloseTo(1896.20, 2);
    expect(result.pointCost).toBe(3000); // 300k * 1%
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThan(result.pointCost);
  });

  test('should handle zero points scenario', () => {
    const zeroPointsScenario = { ...scenario, points: 0 };
    const result = calculateScenarioMetrics(zeroPointsScenario, 300000, 30);

    expect(result.pointCost).toBe(0);
    expect(result.monthlyPI).toBeCloseTo(1896.20, 2);
  });

  test('should handle zero interest rate', () => {
    const zeroRateScenario = { ...scenario, rate: 0, points: 0 };
    const result = calculateScenarioMetrics(zeroRateScenario, 300000, 30);

    expect(result.monthlyPI).toBeCloseTo(833.33, 2); // 300k / 360
    expect(result.totalInterest).toBe(0);
  });

  test('should calculate cost at different time horizons', () => {
    const result = calculateScenarioMetrics(scenario, 300000, 30);

    expect(result.totalCostAt5Years).toBeLessThan(result.totalCostAt10Years);
    expect(result.totalCostAt10Years).toBeLessThan(result.totalCostAtFullTerm);
    expect(result.totalCostAt5Years).toBeGreaterThan(result.pointCost);
  });
});

describe('calculateScenarioMetrics', () => {
  const scenario = {
    id: '1',
    name: 'Test Scenario',
    rate: 6.5,
    points: 1.0,
    isBaseline: false,
  };

  test('should calculate scenario metrics correctly', () => {
    const result = calculateScenarioMetrics(scenario, 300000, 30);

    expect(result.scenario).toBe(scenario);
    expect(result.monthlyPI).toBeCloseTo(1896.20, 2);
    expect(result.pointCost).toBe(3000); // 300k * 1%
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThan(result.pointCost);
  });

  test('should handle zero points scenario', () => {
    const zeroPointsScenario = { ...scenario, points: 0 };
    const result = calculateScenarioMetrics(zeroPointsScenario, 300000, 30);

    expect(result.pointCost).toBe(0);
    expect(result.monthlyPI).toBeCloseTo(1896.20, 2);
  });

  test('should handle zero interest rate', () => {
    const zeroRateScenario = { ...scenario, rate: 0, points: 0 };
    const result = calculateScenarioMetrics(zeroRateScenario, 300000, 30);

    expect(result.monthlyPI).toBeCloseTo(833.33, 2); // 300k / 360
    expect(result.totalInterest).toBe(0);
  });

  test('should calculate cost at different time horizons', () => {
    const result = calculateScenarioMetrics(scenario, 300000, 30);

    expect(result.totalCostAt5Years).toBeLessThan(result.totalCostAt10Years);
    expect(result.totalCostAt10Years).toBeLessThan(result.totalCostAtFullTerm);
    expect(result.totalCostAt5Years).toBeGreaterThan(result.pointCost);
  });

  test('should handle short loan terms', () => {
    const result = calculateScenarioMetrics(scenario, 100000, 5);

    expect(result.monthlyPI).toBeGreaterThan(0);
    // For a 5-year loan, the 5-year cost should be less than or equal to the full term cost
    expect(result.totalCostAt5Years).toBeLessThanOrEqual(result.totalCostAtFullTerm);
    // But they should be relatively close
    expect(result.totalCostAt5Years).toBeGreaterThan(result.totalCostAtFullTerm * 0.85);
  });
});

describe('calculateComparisonResults', () => {
  const baselineScenario: PointsScenario = {
    id: '1',
    name: 'Baseline',
    rate: 7.0,
    points: 0,
    isBaseline: true,
  };

  const compareScenario: PointsScenario = {
    id: '2',
    name: 'With Points',
    rate: 6.5,
    points: 1.5,
    isBaseline: false,
  };

  test('should compare scenarios correctly', () => {
    const result = calculateComparisonResults(
      [baselineScenario, compareScenario],
      300000,
      30
    );

    expect(result).toHaveLength(2);
    
    const baseline = result.find(r => r.scenario.isBaseline);
    const comparison = result.find(r => !r.scenario.isBaseline);

    expect(baseline?.monthlySavings).toBe(0);
    expect(baseline?.breakEvenMonths).toBeNull();
    
    expect(comparison?.monthlySavings).toBeGreaterThan(0);
    expect(comparison?.breakEvenMonths).toBeGreaterThan(0);
  });

  test('should handle multiple comparison scenarios', () => {
    const scenarios: PointsScenario[] = [
      baselineScenario,
      { ...compareScenario, id: '2', name: 'Scenario 2', points: 1.0 },
      { ...compareScenario, id: '3', name: 'Scenario 3', points: 2.0 },
    ];

    const result = calculateComparisonResults(scenarios, 300000, 30);

    expect(result).toHaveLength(3);
    
    const comparisons = result.filter(r => !r.scenario.isBaseline);
    expect(comparisons).toHaveLength(2);
    
    // All comparisons should have positive monthly savings
    comparisons.forEach(comp => {
      expect(comp.monthlySavings).toBeGreaterThan(0);
    });
  });

  test('should return empty array when no baseline', () => {
    const scenarios: PointsScenario[] = [
      { ...compareScenario, isBaseline: false },
    ];

    const result = calculateComparisonResults(scenarios, 300000, 30);
    expect(result).toHaveLength(0);
  });
});

describe('calculateBreakEven', () => {
  const baselineResult: ComparisonResult = {
    scenario: {
      id: '1',
      name: 'Baseline',
      rate: 7.0,
      points: 0,
      isBaseline: true,
    },
    monthlyPI: 1996.27,
    pointCost: 0,
    totalInterest: 418655,
    totalCost: 718655,
    breakEvenMonths: null,
    monthlySavings: 0,
    totalCostAt5Years: 119777,
    totalCostAt10Years: 239555,
    totalCostAtFullTerm: 718655,
  };

  const comparisonResult: ComparisonResult = {
    scenario: {
      id: '2',
      name: 'With Points',
      rate: 6.5,
      points: 1.5,
      isBaseline: false,
    },
    monthlyPI: 1896.20,
    pointCost: 4500,
    totalInterest: 382633,
    totalCost: 687133,
    breakEvenMonths: null,
    monthlySavings: 0,
    totalCostAt5Years: 118231,
    totalCostAt10Years: 231962,
    totalCostAtFullTerm: 687133,
  };

  test('should calculate break-even correctly', () => {
    const result = calculateBreakEven(comparisonResult, baselineResult);

    expect(result.monthlySavings).toBeCloseTo(100.07, 2); // 1996.27 - 1896.20
    expect(result.breakEvenMonths).toBeCloseTo(45, 0); // 4500 / 100.07
  });

  test('should handle scenario with higher payment than baseline', () => {
    const higherPaymentResult = {
      ...comparisonResult,
      monthlyPI: 2100, // Higher than baseline
      pointCost: 3000,
    };

    const result = calculateBreakEven(higherPaymentResult, baselineResult);

    expect(result.monthlySavings).toBeLessThan(0); // Negative savings
    expect(result.breakEvenMonths).toBeNull();
  });
});