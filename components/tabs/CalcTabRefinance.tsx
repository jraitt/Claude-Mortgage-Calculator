import React, { useMemo, useState, useRef } from 'react';
import { RefinanceInputs, RefinanceResult } from '../MortgageCalculator';
import { calculateRefinanceAnalysis } from '../../utils/calculations/refinanceCalculations';
import { formatCurrency, formatMonthsAsYearsMonths } from '../../utils/formatting';
import { SummaryCard, FormField } from '../shared';

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
  const [scrollLocked, setScrollLocked] = useState(true);
  const currentTableRef = useRef<HTMLDivElement>(null);
  const newTableRef = useRef<HTMLDivElement>(null);

  const refinanceResult = useMemo(() => {
    return calculateRefinanceAnalysis(refinanceInputs);
  }, [refinanceInputs]);

  // Generate amortization schedules for comparison
  const { currentSchedule, newSchedule } = useMemo(() => {
    // Generate current loan schedule
    const currentMonthlyRate = refinanceInputs.currentRate / 100 / 12;
    const currentSchedule = [];
    let currentBalance = refinanceInputs.currentBalance;
    let totalInterest = 0;

    // Calculate remaining months for current loan
    const remainingMonths = refinanceResult.remainingMonths;
    
    for (let month = 1; month <= remainingMonths && currentBalance > 0.01; month++) {
      const interestPayment = currentBalance * currentMonthlyRate;
      let principalPayment = refinanceInputs.currentMonthlyPayment - interestPayment;
      
      if (principalPayment <= 0) break;
      
      principalPayment = Math.min(principalPayment, currentBalance);
      currentBalance -= principalPayment;
      totalInterest += interestPayment;

      currentSchedule.push({
        month,
        payment: refinanceInputs.currentMonthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: currentBalance,
        totalInterest
      });
    }

    // Generate new loan schedule
    const newMonthlyRate = refinanceInputs.newRate / 100 / 12;
    const newSchedule = [];
    let newBalance = refinanceResult.newLoanAmount;
    let newTotalInterest = 0;
    const newTermMonths = refinanceInputs.newTerm * 12;

    for (let month = 1; month <= newTermMonths && newBalance > 0.01; month++) {
      const interestPayment = newBalance * newMonthlyRate;
      let principalPayment = refinanceResult.newMonthlyPayment - interestPayment;
      
      if (principalPayment <= 0) break;
      
      principalPayment = Math.min(principalPayment, newBalance);
      newBalance -= principalPayment;
      newTotalInterest += interestPayment;

      newSchedule.push({
        month,
        payment: refinanceResult.newMonthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: newBalance,
        totalInterest: newTotalInterest
      });
    }

    return { currentSchedule, newSchedule };
  }, [refinanceInputs, refinanceResult]);

  const handleCurrentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollLocked && newTableRef.current) {
      newTableRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleNewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollLocked && currentTableRef.current) {
      currentTableRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            label="Current Balance"
            type="number"
            value={refinanceInputs.currentBalance}
            onChange={(value) => setRefinanceInputs({ ...refinanceInputs, currentBalance: parseFloat(value) || 0 })}
          />
          <FormField
            label="Current Rate (%)"
            type="number"
            step="0.001"
            value={refinanceInputs.currentRate}
            onChange={(value) => setRefinanceInputs({ ...refinanceInputs, currentRate: parseFloat(value) || 0 })}
          />
          <FormField
            label="Current Monthly Payment"
            type="number"
            step="0.01"
            value={refinanceInputs.currentMonthlyPayment}
            onChange={(value) => setRefinanceInputs({ ...refinanceInputs, currentMonthlyPayment: parseFloat(value) || 0 })}
            helpText="Principal & Interest only"
          />
        </div>
      </div>

      {/* New Loan Details */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">New Loan Details</h3>
        
        {/* Top row: Interest rate, loan term, include closing costs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={refinanceInputs.newRate || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, newRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
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
        </div>

        {/* Bottom row: Closing costs, points, cash out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Closing Costs ($)</label>
            <input
              type="number"
              value={refinanceInputs.closingCosts || ''}
              onChange={(e) => setRefinanceInputs({ ...refinanceInputs, closingCosts: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Typical: 2-5% of loan amount</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points (%)</label>
            <input
              type="number"
              step="0.125"
              value={refinanceInputs.newPoints || ''}
              onChange={(e) =>
                setRefinanceInputs({ ...refinanceInputs, newPoints: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cost: {formatCurrency(refinanceInputs.currentBalance * (refinanceInputs.newPoints / 100))}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cash Out ($)</label>
            <input
              type="number"
              value={refinanceInputs.cashOut || ''}
              onChange={(e) => setRefinanceInputs({ ...refinanceInputs, cashOut: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Take cash from equity</p>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {refinanceResult.analysisType === 'time-savings' ? 'Time Savings Analysis' : 'Break-Even Analysis'}
        </h3>
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
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {refinanceResult.analysisType === 'time-savings' ? 'Time Saved' : 'Break-Even Point'}
            </div>
            <div className={`text-2xl font-bold ${
              refinanceResult.analysisType === 'time-savings' 
                ? ((refinanceResult.remainingMonths - refinanceInputs.newTerm * 12) >= 60 
                   ? 'text-green-600 dark:text-green-400' 
                   : 'text-blue-600 dark:text-blue-400')
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {refinanceResult.analysisType === 'time-savings' 
                ? `${((refinanceResult.remainingMonths - refinanceInputs.newTerm * 12) / 12).toFixed(1)} yrs`
                : refinanceResult.breakEvenMonths === Infinity ? 'Never' : `${Math.round(refinanceResult.breakEvenMonths)} mo`
              }
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {refinanceResult.analysisType === 'time-savings'
                ? 'Earlier payoff'
                : refinanceResult.breakEvenMonths !== Infinity
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
          refinanceResult.recommendationType === 'excellent'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
            : refinanceResult.recommendationType === 'good'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
            : refinanceResult.recommendationType === 'marginal'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
        }`}
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {refinanceResult.recommendationType === 'excellent'
            ? '✅ '
            : refinanceResult.recommendationType === 'good'
            ? '👍 '
            : refinanceResult.recommendationType === 'marginal'
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
                  {(refinanceResult.remainingMonths / 12).toFixed(1)} years
                </td>
                <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                  {refinanceInputs.newTerm} years
                </td>
                <td
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                    refinanceInputs.newTerm < refinanceResult.remainingMonths / 12
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {(refinanceInputs.newTerm - refinanceResult.remainingMonths / 12).toFixed(1)} years
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

      {/* Amortization Schedule Comparison Section - Full Width */}
      <div className="space-y-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Amortization Schedule Comparison</h2>

        {/* Summary Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            color="red"
            title="Current Loan"
            metrics={[
              { label: 'Remaining Time', value: formatMonthsAsYearsMonths(currentSchedule.length) },
              { label: 'Monthly Payment', value: formatCurrency(refinanceInputs.currentMonthlyPayment) },
              {
                label: 'Remaining Interest',
                value: formatCurrency(currentSchedule[currentSchedule.length - 1]?.totalInterest || 0),
              },
            ]}
          />

          <SummaryCard
            color="blue"
            title="New Loan"
            metrics={[
              { label: 'Loan Term', value: formatMonthsAsYearsMonths(newSchedule.length) },
              { label: 'Monthly Payment', value: formatCurrency(refinanceResult.newMonthlyPayment) },
              {
                label: 'Total Interest',
                value: formatCurrency(newSchedule[newSchedule.length - 1]?.totalInterest || 0),
              },
            ]}
          />

          <SummaryCard
            color="green"
            title="Comparison"
            metrics={[
              { 
                label: 'Time Difference', 
                value: formatMonthsAsYearsMonths(Math.abs(currentSchedule.length - newSchedule.length))
              },
              {
                label: 'Payment Difference',
                value: `${refinanceResult.monthlySavings >= 0 ? '-' : '+'}${formatCurrency(Math.abs(refinanceResult.monthlySavings))}/mo`,
              },
              {
                label: 'Interest Difference',
                value: `${refinanceResult.interestSavings >= 0 ? '-' : '+'}${formatCurrency(Math.abs(refinanceResult.interestSavings))}`,
              },
            ]}
          />
        </div>

        {/* Scroll Lock Control */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setScrollLocked(!scrollLocked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scrollLocked
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {scrollLocked ? '🔒' : '🔓'} {scrollLocked ? 'Unlock' : 'Lock'} Scrolling
          </button>
        </div>

        {/* Side-by-Side Schedule Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Loan Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-200">Current Loan Schedule</h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                {refinanceInputs.currentRate.toFixed(3)}% • {formatMonthsAsYearsMonths(currentSchedule.length)} remaining
              </p>
            </div>
            <div
              ref={currentTableRef}
              onScroll={handleCurrentScroll}
              className={`max-h-[600px] overflow-y-auto ${scrollLocked ? 'border-2 border-blue-200 dark:border-blue-700' : ''}`}
            >
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Month
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Payment
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Principal
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Interest
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedule.map((payment, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-2 text-gray-900 dark:text-gray-100">{payment.month}</td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.payment)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.principal)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.interest)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Loan Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">New Loan Schedule</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {refinanceInputs.newRate.toFixed(3)}% • {refinanceInputs.newTerm} year term
              </p>
            </div>
            <div
              ref={newTableRef}
              onScroll={handleNewScroll}
              className={`max-h-[600px] overflow-y-auto ${scrollLocked ? 'border-2 border-blue-200 dark:border-blue-700' : ''}`}
            >
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Month
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Payment
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Principal
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Interest
                    </th>
                    <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newSchedule.map((payment, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-2 text-gray-900 dark:text-gray-100">{payment.month}</td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.payment)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.principal)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.interest)}
                      </td>
                      <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {scrollLocked && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              🔒 <strong>Scroll Lock Active:</strong> Both tables will scroll together. Click "Unlock Scrolling" to
              scroll independently.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
