import React, { useMemo } from 'react';
import { PointsScenario, ComparisonResult } from '../MortgageCalculator';
import { formatCurrency } from '../../utils/formatting';
import { validatePointsInputs, validatePointsScenario } from '../../utils/validation';
import { FormField } from '../shared';

interface CalcTabPointsProps {
  scenarios: PointsScenario[];
  setScenarios: React.Dispatch<React.SetStateAction<PointsScenario[]>>;
  pointsCalcLoanAmount: number;
  setPointsCalcLoanAmount: React.Dispatch<React.SetStateAction<number>>;
  pointsCalcTerm: number;
  setPointsCalcTerm: React.Dispatch<React.SetStateAction<number>>;
  loanAmount: number;
  loanTerm: number;
}

export const CalcTabPoints: React.FC<CalcTabPointsProps> = ({
  scenarios,
  setScenarios,
  pointsCalcLoanAmount,
  setPointsCalcLoanAmount,
  pointsCalcTerm,
  setPointsCalcTerm,
  loanAmount,
  loanTerm,
}) => {
  // Calculate metrics for a single scenario
  const calculateScenarioMetrics = (scenario: PointsScenario, loanAmt: number, term: number): ComparisonResult => {
    const monthlyRate = scenario.rate / 100 / 12;
    const totalPayments = term * 12;

    // Calculate monthly P&I
    const monthlyPI =
      monthlyRate === 0
        ? loanAmt / totalPayments
        : (loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // Calculate point cost
    const pointCost = loanAmt * (scenario.points / 100);

    // Calculate total interest over loan life
    let remainingBalance = loanAmt;
    let totalInterest = 0;
    for (let month = 1; month <= totalPayments && remainingBalance > 0.01; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPI - interestPayment;
      totalInterest += interestPayment;
      remainingBalance -= principalPayment;
    }

    // Total cost = point cost + all payments
    const totalCost = pointCost + monthlyPI * totalPayments;

    // Calculate total cost at different time horizons
    const calculateCostAtMonth = (months: number) => {
      let balance = loanAmt;
      const paymentsToCalculate = Math.min(months, totalPayments);

      for (let m = 1; m <= paymentsToCalculate; m++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPI - interest;
        balance -= principal;
      }

      return pointCost + monthlyPI * paymentsToCalculate;
    };

    return {
      scenario,
      monthlyPI,
      pointCost,
      totalInterest,
      totalCost,
      breakEvenMonths: null,
      monthlySavings: 0,
      totalCostAt5Years: calculateCostAtMonth(60),
      totalCostAt10Years: calculateCostAtMonth(120),
      totalCostAtFullTerm: totalCost,
    };
  };

  // Calculate break-even vs baseline
  const calculateBreakEven = (result: ComparisonResult, baseline: ComparisonResult): ComparisonResult => {
    const pointCostDiff = result.pointCost - baseline.pointCost;
    const monthlySavings = baseline.monthlyPI - result.monthlyPI;

    let breakEvenMonths = null;
    if (monthlySavings > 0 && pointCostDiff > 0) {
      breakEvenMonths = pointCostDiff / monthlySavings;
    }

    return {
      ...result,
      monthlySavings,
      breakEvenMonths,
    };
  };

  // Validate inputs
  const validation = useMemo(() => {
    return validatePointsInputs({
      loanAmount: pointsCalcLoanAmount,
      loanTerm: pointsCalcTerm,
    });
  }, [pointsCalcLoanAmount, pointsCalcTerm]);

  // Validate scenarios
  const scenarioValidations = useMemo(() => {
    return scenarios.map(scenario => validatePointsScenario(scenario));
  }, [scenarios]);

  // Calculate comparison results for all scenarios
  const comparisonResults = useMemo(() => {
    const baseline = scenarios.find((s) => s.isBaseline);
    if (!baseline) return [];

    const baselineResult = calculateScenarioMetrics(baseline, pointsCalcLoanAmount, pointsCalcTerm);
    const results = scenarios.map((scenario) => {
      const result = calculateScenarioMetrics(scenario, pointsCalcLoanAmount, pointsCalcTerm);
      return scenario.isBaseline ? result : calculateBreakEven(result, baselineResult);
    });

    return results;
  }, [scenarios, pointsCalcLoanAmount, pointsCalcTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Points Calculator</h2>
        <button
          onClick={() => {
            const newId = (scenarios.length + 1).toString();
            setScenarios([
              ...scenarios,
              {
                id: newId,
                name: `Scenario ${newId}`,
                rate: 6.0,
                points: 0,
                isBaseline: false,
              },
            ]);
          }}
          className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Scenario
        </button>
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Invalid Input Detected</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Common Inputs */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Loan Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Loan Amount"
            type="number"
            value={pointsCalcLoanAmount}
            onChange={(value) => setPointsCalcLoanAmount(parseFloat(value) || 0)}
            error={validation.errors.find(e => e.toLowerCase().includes('loan amount'))}
            isValid={!validation.errors.some(e => e.toLowerCase().includes('loan amount'))}
            helpText={!validation.errors.some(e => e.toLowerCase().includes('loan amount')) ? 
              `Default from Calculator tab: ${formatCurrency(loanAmount)}` : undefined}
          />
          
          <FormField
            label="Loan Term (years)"
            type="select"
            value={pointsCalcTerm}
            onChange={(value) => setPointsCalcTerm(parseInt(value))}
            error={validation.errors.find(e => e.toLowerCase().includes('loan term'))}
            isValid={!validation.errors.some(e => e.toLowerCase().includes('loan term'))}
            helpText={!validation.errors.some(e => e.toLowerCase().includes('loan term')) ? 
              `Default from Calculator tab: ${loanTerm} years` : undefined}
            options={[
              { value: 15, label: '15 years' },
              { value: 20, label: '20 years' },
              { value: 25, label: '25 years' },
              { value: 30, label: '30 years' },
            ]}
          />
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <div
            key={scenario.id}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 ${
              scenario.isBaseline ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {scenario.points === 0 ? '0 Points' : `${scenario.points}% Points`}
              </div>
              {scenarios.length > 2 && (
                <button
                  onClick={() => setScenarios(scenarios.filter((s) => s.id !== scenario.id))}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2"
                  title="Remove scenario"
                >
                  ×
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 mb-3 text-sm">
              <input
                type="checkbox"
                checked={scenario.isBaseline}
                onChange={(e) => {
                  const updated = scenarios.map((s) => ({
                    ...s,
                    isBaseline: s.id === scenario.id ? e.target.checked : false,
                  }));
                  setScenarios(updated);
                }}
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <span className="text-blue-700 dark:text-blue-300 font-medium">Set as Baseline</span>
            </label>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={scenario.rate || ''}
                  onChange={(e) => {
                    const updated = [...scenarios];
                    updated[index].rate = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setScenarios(updated);
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Points (%)</label>
                <input
                  type="number"
                  step="0.125"
                  value={scenario.points}
                  onChange={(e) => {
                    const updated = [...scenarios];
                    updated[index].points = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setScenarios(updated);
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cost: {formatCurrency(pointsCalcLoanAmount * ((scenario.points || 0) / 100))}
                </p>
              </div>
            </div>

            {comparisonResults[index] && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly P&I:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(comparisonResults[index].monthlyPI)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Point Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(comparisonResults[index].pointCost)}
                    </span>
                  </div>
                  {!scenario.isBaseline && comparisonResults[index].breakEvenMonths && (
                    <div className="flex justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Break-even:</span>
                      <span className="font-bold text-blue-800 dark:text-blue-200">
                        {Math.round(comparisonResults[index].breakEvenMonths!)} months (
                        {(comparisonResults[index].breakEvenMonths! / 12).toFixed(1)} yrs)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Break-Even Analysis Summary */}
      {comparisonResults.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Break-Even Analysis</h3>
          <div className="space-y-3">
            {comparisonResults.map((result, idx) => {
              if (result.scenario.isBaseline) {
                return (
                  <div
                    key={result.scenario.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-blue-500 dark:border-blue-400"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        📍 {result.scenario.name} (Baseline)
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(result.monthlyPI)}/mo
                      </span>
                    </div>
                  </div>
                );
              }

              if (result.breakEvenMonths) {
                return (
                  <div
                    key={result.scenario.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{result.scenario.name}</span>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {result.scenario.rate}% • {result.scenario.points}% points •{' '}
                          {formatCurrency(result.monthlyPI)}/mo
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-700 dark:text-green-400 font-semibold">
                          Saves {formatCurrency(Math.abs(result.monthlySavings))}/mo
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          +
                          {formatCurrency(
                            result.pointCost - comparisonResults.find((r) => r.scenario.isBaseline)!.pointCost
                          )}{' '}
                          in points
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          Break-even in {Math.round(result.breakEvenMonths)} months (
                          {(result.breakEvenMonths / 12).toFixed(1)} years)
                        </span>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {result.breakEvenMonths < 60
                            ? '✓ Good deal if staying 5+ years'
                            : result.breakEvenMonths < 120
                            ? '⚠ Only worth it if staying 10+ years'
                            : '❌ Takes very long to break even'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Total Cost Comparison at Different Time Horizons */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Total Cost Comparison Over Time
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Scenario
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Rate
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Points
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Monthly P&I
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Point Cost
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  5 Years
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  10 Years
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Full Term
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonResults.map((result, idx) => {
                const costAt5 = result.totalCostAt5Years;
                const costAt10 = result.totalCostAt10Years;
                const costAtFull = result.totalCostAtFullTerm;

                const lowestAt5 = Math.min(...comparisonResults.map((r) => r.totalCostAt5Years));
                const lowestAt10 = Math.min(...comparisonResults.map((r) => r.totalCostAt10Years));
                const lowestAtFull = Math.min(...comparisonResults.map((r) => r.totalCostAtFullTerm));

                return (
                  <tr
                    key={result.scenario.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      result.scenario.isBaseline ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{result.scenario.name}</span>
                      {result.scenario.isBaseline && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Baseline
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                      {result.scenario.rate.toFixed(3)}%
                    </td>
                    <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                      {result.scenario.points.toFixed(3)}%
                    </td>
                    <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(result.monthlyPI)}
                    </td>
                    <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(result.pointCost)}
                    </td>
                    <td
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${
                        costAt5 === lowestAt5
                          ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatCurrency(costAt5)}
                    </td>
                    <td
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${
                        costAt10 === lowestAt10
                          ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatCurrency(costAt10)}
                    </td>
                    <td
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${
                        costAtFull === lowestAtFull
                          ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatCurrency(costAtFull)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <strong>💡 How to read this table:</strong> Green highlighted cells show the lowest total cost at each time
          horizon. This helps you choose the best option based on how long you plan to keep the loan.
        </div>
      </div>

      {/* Smart Recommendations */}
      {comparisonResults.length > 0 &&
        (() => {
          const bestAt5 = comparisonResults.reduce((min, r) =>
            r.totalCostAt5Years < min.totalCostAt5Years ? r : min
          );
          const bestAt10 = comparisonResults.reduce((min, r) =>
            r.totalCostAt10Years < min.totalCostAt10Years ? r : min
          );
          const bestAtFull = comparisonResults.reduce((min, r) =>
            r.totalCostAtFullTerm < min.totalCostAtFullTerm ? r : min
          );

          return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                🎯 Smart Recommendations
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    If you keep the loan for 5 years:
                  </div>
                  <div className="text-green-700 dark:text-green-400">
                    ✓ Choose <strong>{bestAt5.scenario.name}</strong> - Total cost:{' '}
                    {formatCurrency(bestAt5.totalCostAt5Years)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    If you keep the loan for 10 years:
                  </div>
                  <div className="text-green-700 dark:text-green-400">
                    ✓ Choose <strong>{bestAt10.scenario.name}</strong> - Total cost:{' '}
                    {formatCurrency(bestAt10.totalCostAt10Years)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    If you keep the loan for the full {pointsCalcTerm}-year term:
                  </div>
                  <div className="text-green-700 dark:text-green-400">
                    ✓ Choose <strong>{bestAtFull.scenario.name}</strong> - Total cost:{' '}
                    {formatCurrency(bestAtFull.totalCostAtFullTerm)}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded">
                <strong>Note:</strong> Most homeowners refinance or move within 7-10 years. Consider this when weighing
                upfront costs vs. long-term savings.
              </div>
            </div>
          );
        })()}
    </div>
  );
};
