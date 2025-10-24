import React, { useState, useRef } from 'react';
import { MortgageInputs } from '../MortgageCalculator';
import { FormField, SummaryCard } from '../shared';
import { formatCurrency } from '../../utils/formatting';

interface CalcTabExistingMortgageProps {
  inputs: MortgageInputs;
  setInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  updateInput: (field: string, value: string) => void;
  loanAmount: number;
  monthlyPI: number;
  monthlyRate: number;
  standardSchedule: any[];
  paydownSchedule: any[];
}

export const CalcTabExistingMortgage: React.FC<CalcTabExistingMortgageProps> = ({
  inputs,
  setInputs,
  updateInput,
  loanAmount,
  monthlyPI,
  monthlyRate,
  standardSchedule,
  paydownSchedule,
}) => {
  const [scrollLocked, setScrollLocked] = useState(true);
  const standardTableRef = useRef<HTMLDivElement>(null);
  const paydownTableRef = useRef<HTMLDivElement>(null);

  const handleStandardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollLocked && paydownTableRef.current) {
      paydownTableRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handlePaydownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollLocked && standardTableRef.current) {
      standardTableRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Existing Loan Details</h2>

        <div className="space-y-6">
          {/* Existing Loan Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Start Date</label>
            <input
              type="date"
              value={inputs.loanStartDate}
              onChange={(e) => setInputs((prev: MortgageInputs) => ({ ...prev, loanStartDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Original Principal"
              type="number"
              value={inputs.originalPrincipal}
              onChange={(value) => updateInput('originalPrincipal', value)}
            />

            <FormField
              label="Current Balance"
              type="number"
              value={inputs.currentBalance}
              onChange={(value) => updateInput('currentBalance', value)}
            />
          </div>

          <div>
            <FormField
              label="Payments Already Made"
              type="number"
              value={inputs.paymentsMade}
              onChange={(value) => updateInput('paymentsMade', value)}
              helpText={`${inputs.paymentsMade} of ${inputs.loanTerm * 12} payments completed`}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Paydown Options</h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={inputs.biWeeklyPayments}
                onChange={(e) =>
                  setInputs((prev: MortgageInputs) => ({
                    ...prev,
                    biWeeklyPayments: e.target.checked,
                    extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                    doubleMonthlyPrincipal: e.target.checked ? false : prev.doubleMonthlyPrincipal,
                    extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment,
                  }))
                }
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">Bi-Weekly Payments</span>
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>How it works:</strong> Pay half your monthly payment ({formatCurrency(monthlyPI / 2)}) every two
                weeks. This results in 26 payments per year (equivalent to 13 monthly payments), significantly reducing
                your loan term and interest.
              </p>
              {inputs.biWeeklyPayments && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Bi-weekly payment:</span>
                    <div className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency(monthlyPI / 2)}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Annual total:</span>
                    <div className="font-bold text-blue-800 dark:text-blue-200">
                      {formatCurrency((monthlyPI / 2) * 26)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={inputs.doubleMonthlyPrincipal}
                onChange={(e) =>
                  setInputs((prev: MortgageInputs) => ({
                    ...prev,
                    doubleMonthlyPrincipal: e.target.checked,
                    biWeeklyPayments: e.target.checked ? false : prev.biWeeklyPayments,
                    extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                    extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment,
                  }))
                }
                className="w-4 h-4 text-green-600 dark:text-green-400"
              />
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Double Monthly Principal Payment
              </span>
            </label>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-6">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>How it works:</strong> Pay an extra principal amount equal to your regular principal payment (
                {formatCurrency(monthlyPI - loanAmount * monthlyRate)}). This doubles the principal portion of each
                payment, dramatically reducing your loan term.
              </p>
              {inputs.doubleMonthlyPrincipal && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 dark:text-green-300">Regular principal:</span>
                    <div className="font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(monthlyPI - loanAmount * monthlyRate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-300">Total monthly payment:</span>
                    <div className="font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(monthlyPI + (monthlyPI - loanAmount * monthlyRate))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!inputs.biWeeklyPayments && !inputs.doubleMonthlyPrincipal && (
            <>
              <FormField
                label="Extra Monthly Principal"
                type="number"
                value={inputs.extraMonthlyPrincipal}
                onChange={(value) => updateInput('extraMonthlyPrincipal', value)}
                placeholder="0"
              />

              <FormField
                label="Extra Annual Payment"
                type="number"
                value={inputs.extraAnnualPayment}
                onChange={(value) => updateInput('extraAnnualPayment', value)}
                placeholder="0"
                helpText="Applied every December (bonus, tax refund, etc.)"
              />
            </>
          )}
        </div>
      </div>
    </div>

    {/* Schedule Comparison Section - Full Width */}
    <div className="space-y-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Schedule Comparison</h2>

      {/* Summary Comparison */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          color="red"
          title="Original Schedule"
          metrics={[
            { label: 'Payoff Time', value: `${standardSchedule.length} months` },
            { label: 'Monthly Payment', value: formatCurrency(monthlyPI) },
            {
              label: 'Total Interest',
              value: formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0),
            },
          ]}
        />

        <SummaryCard
          color="green"
          title={
            inputs.biWeeklyPayments
              ? 'Bi-Weekly Strategy'
              : inputs.doubleMonthlyPrincipal
              ? 'Double Principal Strategy'
              : inputs.extraMonthlyPrincipal > 0 || inputs.extraAnnualPayment > 0
              ? 'Extra Payment Strategy'
              : 'No Strategy Selected'
          }
          metrics={[
            { label: 'Payoff Time', value: `${paydownSchedule.length} months` },
            {
              label: 'Payment Amount',
              value: inputs.biWeeklyPayments
                ? `${formatCurrency(monthlyPI / 2)} bi-weekly`
                : inputs.doubleMonthlyPrincipal
                ? formatCurrency(monthlyPI + (monthlyPI - loanAmount * monthlyRate))
                : formatCurrency(monthlyPI + inputs.extraMonthlyPrincipal),
            },
            {
              label: 'Total Interest',
              value: formatCurrency(paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0),
            },
          ]}
        />

        <SummaryCard
          color="blue"
          title="Savings"
          metrics={[
            { label: 'Time Saved', value: `${standardSchedule.length - paydownSchedule.length} months` },
            {
              label: 'Interest Saved',
              value: formatCurrency(
                (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) -
                  (paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0)
              ),
            },
            {
              label: 'Early Payoff',
              value: new Date(Date.now() + paydownSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  year: 'numeric',
                }
              ),
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
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Original Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-800 dark:text-red-200">Original Schedule</h3>
            <p className="text-sm text-red-600 dark:text-red-300">Standard monthly payments</p>
          </div>
          <div
            ref={standardTableRef}
            onScroll={handleStandardScroll}
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
                {standardSchedule.map((payment, index) => (
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

        {/* Paydown Strategy Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              {inputs.biWeeklyPayments
                ? 'Bi-Weekly Strategy'
                : inputs.doubleMonthlyPrincipal
                ? 'Double Principal Strategy'
                : 'Enhanced Payment Strategy'}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {inputs.biWeeklyPayments
                ? 'Payment every 2 weeks'
                : inputs.doubleMonthlyPrincipal
                ? 'Double principal payments'
                : 'With extra payments'}
            </p>
          </div>
          <div
            ref={paydownTableRef}
            onScroll={handlePaydownScroll}
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
                {paydownSchedule.map((payment, index) => (
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

      {/* Schedule Information */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Original Schedule Details</h4>
          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Total Payments:</span>
              <span>{standardSchedule.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Years to Pay Off:</span>
              <span>{(standardSchedule.length / 12).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Strategy Schedule Details</h4>
          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Total Payments:</span>
              <span>{paydownSchedule.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Years to Pay Off:</span>
              <span>{(paydownSchedule.length / 12).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {paydownSchedule.length === standardSchedule.length && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            💡 <strong>Tip:</strong> Select a paydown strategy above to see the comparison between schedules.
          </p>
        </div>
      )}

      {scrollLocked && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            🔒 <strong>Scroll Lock Active:</strong> Both tables will scroll together. Click "Unlock Scrolling" to
            scroll independently.
          </p>
        </div>
      )}
    </div>
    </>
  );
};
