import React, { useMemo } from 'react';
import { RefinanceInputs, RefinanceResult } from '../MortgageCalculator';
import { calculateRefinanceAnalysis } from '../../utils/calculations/refinanceCalculations';
import { formatCurrency } from '../../utils/formatting';

interface CalcTabRefinanceProps {
  refinanceInputs: RefinanceInputs;
  setRefinanceInputs: React.Dispatch<React.SetStateAction<RefinanceInputs>>;
  refinanceValidationErrors: string[];
}

export const CalcTabRefinance: React.FC<CalcTabRefinanceProps> = ({
  refinanceInputs,
  setRefinanceInputs,
  refinanceValidationErrors,
}) => {
  const refinanceResult = useMemo(() => {
    return calculateRefinanceAnalysis(refinanceInputs);
  }, [refinanceInputs]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Refinance Calculator</h2>
      </div>

      {/* Validation Errors */}
      {refinanceValidationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Invalid Input Detected</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {refinanceValidationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Loan Details */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Current Loan Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Balance</label>
            <input
              type="number"
              value={refinanceInputs.currentBalance || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, currentBalance: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Rate (%)</label>
            <input
              type="number"
              step="0.001"
              value={refinanceInputs.currentRate || ''}
              onChange={(e) =>
                setRefinanceInputs({
                  ...refinanceInputs,
                  currentRate: e.target.value === '' ? 0 : parseFloat(e.target.value),
                })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Monthly Payment
            </label>
            <input
              type="number"
              step="0.01"
              value={refinanceInputs.currentMonthlyPayment ? refinanceInputs.currentMonthlyPayment.toFixed(2) : ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, currentMonthlyPayment: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remaining Months</label>
            <input
              type="number"
              value={refinanceInputs.remainingMonths || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, remainingMonths: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(refinanceInputs.remainingMonths / 12).toFixed(1)} years remaining
            </p>
          </div>
        </div>
      </div>

      {/* New Loan Details */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">New Loan Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={refinanceInputs.newRate || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, newRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Loan Term (years)
            </label>
            <select
              value={refinanceInputs.newTerm}
              onChange={(e) => setRefinanceInputs({ ...refinanceInputs, newTerm: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={25}>25 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Closing Costs ($)</label>
            <input
              type="number"
              value={refinanceInputs.closingCosts || ''}
              onChange={(e) => setRefinanceInputs({ ...refinanceInputs, closingCosts: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Typical: 2-5% of loan amount</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Include Closing Costs in Loan
            </label>
            <select
              value={refinanceInputs.includeClosingCostsInLoan ? 'yes' : 'no'}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, includeClosingCostsInLoan: e.target.value === 'yes' })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="no">No - Pay out of pocket</option>
              <option value="yes">Yes - Add to loan amount</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {refinanceInputs.includeClosingCostsInLoan ? 'Will increase loan balance' : 'Pay upfront at closing'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cash Out ($)</label>
            <input
              type="number"
              value={refinanceInputs.cashOut || ''}
              onChange={(e) => setRefinanceInputs({ ...refinanceInputs, cashOut: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Take cash from equity</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points (%)</label>
            <input
              type="number"
              step="0.125"
              value={refinanceInputs.newPoints || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, newPoints: e.target.value === '' ? 0 : parseFloat(e.target.value) })
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cost: {formatCurrency(refinanceInputs.currentBalance * (refinanceInputs.newPoints / 100))}
            </p>
          </div>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Break-Even Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Monthly Payment</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(refinanceResult.newMonthlyPayment)}
            </div>
            <div
              className={`text-sm mt-1 ${
                refinanceResult.monthlySavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {refinanceResult.monthlySavings > 0 ? '↓' : '↑'} {formatCurrency(Math.abs(refinanceResult.monthlySavings))}
              /mo
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Closing Costs</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(refinanceResult.totalClosingCosts)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {((refinanceResult.totalClosingCosts / refinanceInputs.currentBalance) * 100).toFixed(2)}% of balance
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Break-Even Point</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {refinanceResult.breakEvenMonths === Infinity ? 'Never' : `${Math.round(refinanceResult.breakEvenMonths)} mo`}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {refinanceResult.breakEvenMonths !== Infinity
                ? `${(refinanceResult.breakEvenMonths / 12).toFixed(1)} years`
                : 'Payment increased'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Savings</div>
            <div
              className={`text-2xl font-bold ${
                refinanceResult.interestSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(refinanceResult.interestSavings)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Over life of loan</div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div
        className={`p-6 rounded-lg border-2 ${
          refinanceResult.breakEvenMonths < 60 && refinanceResult.monthlySavings > 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
            : refinanceResult.breakEvenMonths < 120 && refinanceResult.monthlySavings > 0
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
        }`}
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {refinanceResult.breakEvenMonths < 60 && refinanceResult.monthlySavings > 0
            ? '✅ '
            : refinanceResult.breakEvenMonths < 120 && refinanceResult.monthlySavings > 0
            ? '⚠️ '
            : '❌ '}
          Recommendation
        </h3>
        <p className="text-gray-700 dark:text-gray-200 text-lg">{refinanceResult.recommendation}</p>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Metric
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Current Loan
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  New Loan
                </th>
                <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  Loan Amount
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceInputs.currentBalance)}
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.newLoanAmount)}
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceResult.newLoanAmount > refinanceInputs.currentBalance
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {refinanceResult.newLoanAmount > refinanceInputs.currentBalance ? '+' : '-'}
                  {formatCurrency(Math.abs(refinanceResult.newLoanAmount - refinanceInputs.currentBalance))}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  Monthly Payment
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceInputs.currentMonthlyPayment)}
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.newMonthlyPayment)}
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceResult.monthlySavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {refinanceResult.monthlySavings > 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(refinanceResult.monthlySavings))}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  Interest Rate
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {refinanceInputs.currentRate.toFixed(3)}%
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {refinanceInputs.newRate.toFixed(3)}%
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceInputs.newRate < refinanceInputs.currentRate
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {(refinanceInputs.newRate - refinanceInputs.currentRate).toFixed(3)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">Loan Term</td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {(refinanceInputs.remainingMonths / 12).toFixed(1)} years
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {refinanceInputs.newTerm} years
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceInputs.newTerm < refinanceInputs.remainingMonths / 12
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {(refinanceInputs.newTerm - refinanceInputs.remainingMonths / 12).toFixed(1)} years
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  Total Interest
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.currentTotalInterest)}
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.newTotalInterest)}
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceResult.interestSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {refinanceResult.interestSavings > 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(refinanceResult.interestSavings))}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100">
                  Total Cost (Principal + Interest)
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.currentTotalCost)}
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(refinanceResult.newTotalCost)}
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-bold ${
                    refinanceResult.netSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {refinanceResult.netSavings > 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(refinanceResult.netSavings))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Comparison Over Time */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Cost Comparison Over Time</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">After 5 Years</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(refinanceResult.costAt5Years)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {refinanceResult.breakEvenMonths < 60 && refinanceResult.breakEvenMonths !== Infinity
                ? '✓ Break-even achieved'
                : refinanceResult.breakEvenMonths !== Infinity
                ? `Need ${Math.round(refinanceResult.breakEvenMonths - 60)} more months`
                : 'No break-even'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">After 10 Years</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(refinanceResult.costAt10Years)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {refinanceResult.breakEvenMonths < 120 && refinanceResult.breakEvenMonths !== Infinity
                ? '✓ Break-even achieved'
                : refinanceResult.breakEvenMonths !== Infinity
                ? `Need ${Math.round(refinanceResult.breakEvenMonths - 120)} more months`
                : 'No break-even'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Full Term ({refinanceInputs.newTerm} years)
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(refinanceResult.costAtFullTerm)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Total cost including closing</div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Key Insights</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Monthly Cash Flow Impact</div>
              <div className="text-gray-600 dark:text-gray-400">
                Your monthly payment will {refinanceResult.monthlySavings > 0 ? 'decrease' : 'increase'} by{' '}
                <strong>{formatCurrency(Math.abs(refinanceResult.monthlySavings))}</strong>.
                {refinanceResult.monthlySavings > 0 &&
                  ` That's ${formatCurrency(Math.abs(refinanceResult.monthlySavings) * 12)}/year in savings.`}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Time Horizon</div>
              <div className="text-gray-600 dark:text-gray-400">
                {refinanceResult.breakEvenMonths !== Infinity ? (
                  <>
                    You need to stay in the home for at least{' '}
                    <strong>
                      {Math.round(refinanceResult.breakEvenMonths)} months (
                      {(refinanceResult.breakEvenMonths / 12).toFixed(1)} years)
                    </strong>{' '}
                    to break even on closing costs.
                  </>
                ) : (
                  'Your monthly payment increases, so there is no break-even point from a payment perspective.'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Long-term Savings</div>
              <div className="text-gray-600 dark:text-gray-400">
                {refinanceResult.netSavings > 0 ? (
                  <>
                    Over the life of the loan, you'll save a net{' '}
                    <strong className="text-green-600 dark:text-green-400">
                      {formatCurrency(refinanceResult.netSavings)}
                    </strong>{' '}
                    after accounting for closing costs.
                  </>
                ) : (
                  <>
                    Over the life of the loan, you'll pay an additional{' '}
                    <strong className="text-red-600 dark:text-red-400">
                      {formatCurrency(Math.abs(refinanceResult.netSavings))}
                    </strong>{' '}
                    compared to keeping your current loan.
                  </>
                )}
              </div>
            </div>
          </div>
          {refinanceInputs.cashOut > 0 && (
            <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded">
              <span className="text-2xl">💵</span>
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">Cash-Out Refinance</div>
                <div className="text-gray-600 dark:text-gray-400">
                  You're taking out <strong>{formatCurrency(refinanceInputs.cashOut)}</strong> in cash, which will be
                  added to your new loan balance.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
