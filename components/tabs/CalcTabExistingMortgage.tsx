import React, { useState, useRef, useMemo } from 'react';
import { MortgageInputs, PaydownStrategy } from '../MortgageCalculator';
import { FormField, SummaryCard, Tooltip } from '../shared';
import { formatCurrency, formatMonthsAsYearsMonths } from '../../utils/formatting';
import { HelpCircle } from 'lucide-react';
import { validateExistingMortgageInputs } from '../../utils/validation';

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

  // Validate existing mortgage inputs
  const validation = useMemo(() => {
    return validateExistingMortgageInputs({
      originalPrincipal: loanAmount, // Use calculated loan amount as original principal
      currentBalance: inputs.currentBalance,
      paymentsMade: 0, // This field isn't in the current inputs type
      loanTerm: inputs.loanTerm,
      interestRate: inputs.existingInterestRate || inputs.interestRate,
      extraMonthlyPrincipal: inputs.extraMonthlyPrincipal,
      extraAnnualPayment: inputs.extraAnnualPayment,
    });
  }, [loanAmount, inputs.currentBalance, inputs.loanTerm, inputs.existingInterestRate, inputs.interestRate, inputs.extraMonthlyPrincipal, inputs.extraAnnualPayment]);

  // Individual field validation
  const getFieldError = (field: string): string | undefined => {
    if (validation.isValid) return undefined;
    
    const fieldErrors: { [key: string]: string[] } = {
      currentBalance: validation.errors.filter(e => e.toLowerCase().includes('current balance')),
      loanTerm: validation.errors.filter(e => e.toLowerCase().includes('loan term')),
      interestRate: validation.errors.filter(e => e.toLowerCase().includes('interest rate')),
      existingInterestRate: validation.errors.filter(e => e.toLowerCase().includes('interest rate')),
      existingMonthlyPayment: validation.errors.filter(e => e.toLowerCase().includes('monthly payment')),
      extraMonthlyPrincipal: validation.errors.filter(e => e.toLowerCase().includes('extra monthly')),
      extraAnnualPayment: validation.errors.filter(e => e.toLowerCase().includes('extra annual')),
    };
    
    return fieldErrors[field]?.[0];
  };

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
      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400 rounded-lg p-4 mb-6">
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

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Existing Loan Details</h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <FormField
            label="Current Balance ($)"
            type="number"
            value={inputs.currentBalance}
            onChange={(value) => updateInput('currentBalance', value)}
            error={getFieldError('currentBalance')}
            isValid={!getFieldError('currentBalance')}
            helpText={!getFieldError('currentBalance') ? "What you currently owe on your mortgage" : undefined}
          />

          <FormField
            label="Monthly Payment ($)"
            type="number"
            step="0.01"
            value={inputs.existingMonthlyPayment}
            onChange={(value) => updateInput('existingMonthlyPayment', value)}
            error={getFieldError('existingMonthlyPayment')}
            isValid={!getFieldError('existingMonthlyPayment')}
            helpText={!getFieldError('existingMonthlyPayment') ? "Principal & Interest only (exclude taxes, insurance, PMI)" : undefined}
          />

          <FormField
            label="Interest Rate (%)"
            type="number"
            step="0.01"
            value={inputs.existingInterestRate}
            onChange={(value) => updateInput('existingInterestRate', value)}
            error={getFieldError('existingInterestRate')}
            isValid={!getFieldError('existingInterestRate')}
            helpText={!getFieldError('existingInterestRate') ? "Your current annual interest rate" : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Paydown Options</h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Radio Option 1: Extra Payments */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="paydownStrategy"
                value="extra-payments"
                checked={inputs.paydownStrategy === 'extra-payments'}
                onChange={(e) =>
                  setInputs((prev: MortgageInputs) => ({
                    ...prev,
                    paydownStrategy: e.target.value as PaydownStrategy,
                    biWeeklyPayments: false,
                    doubleMonthlyPrincipal: false,
                  }))
                }
                className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Repayment with extra payments
                  </span>
                  <Tooltip content="Add extra principal payments monthly, annually, or as a one-time payment to pay off your loan faster.">
                    <HelpCircle size={16} className="text-gray-400 dark:text-gray-500" />
                  </Tooltip>
                </div>

                {inputs.paydownStrategy === 'extra-payments' && (
                  <div className="mt-3 space-y-3">
                    <FormField
                      label="Extra per month ($)"
                      type="number"
                      value={inputs.extraMonthlyPrincipal}
                      onChange={(value) => updateInput('extraMonthlyPrincipal', value)}
                      placeholder="0"
                      error={getFieldError('extraMonthlyPrincipal')}
                      isValid={!getFieldError('extraMonthlyPrincipal')}
                    />
                    <FormField
                      label="Extra per year ($)"
                      type="number"
                      value={inputs.extraAnnualPayment}
                      onChange={(value) => updateInput('extraAnnualPayment', value)}
                      placeholder="0"
                      error={getFieldError('extraAnnualPayment')}
                      isValid={!getFieldError('extraAnnualPayment')}
                      helpText={!getFieldError('extraAnnualPayment') ? "Applied every December" : undefined}
                    />
                    <FormField
                      label="Extra one time ($)"
                      type="number"
                      value={inputs.extraOneTimePayment}
                      onChange={(value) => updateInput('extraOneTimePayment', value)}
                      placeholder="0"
                      helpText="Applied to next payment"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Radio Option 2: Biweekly */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="paydownStrategy"
                value="biweekly"
                checked={inputs.paydownStrategy === 'biweekly'}
                onChange={(e) =>
                  setInputs((prev: MortgageInputs) => ({
                    ...prev,
                    paydownStrategy: e.target.value as PaydownStrategy,
                    biWeeklyPayments: true,
                    doubleMonthlyPrincipal: false,
                    extraMonthlyPrincipal: 0,
                    extraAnnualPayment: 0,
                    extraOneTimePayment: 0,
                  }))
                }
                className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">Biweekly repayment</span>
                <Tooltip content="Pay half your monthly payment every 2 weeks. Results in 26 payments/year (13 monthly payments), significantly reducing loan term.">
                  <HelpCircle size={16} className="text-gray-400 dark:text-gray-500" />
                </Tooltip>
              </div>
            </label>
          </div>

          {/* Radio Option 3: Double Principal */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="paydownStrategy"
                value="double-principal"
                checked={inputs.paydownStrategy === 'double-principal'}
                onChange={(e) =>
                  setInputs((prev: MortgageInputs) => ({
                    ...prev,
                    paydownStrategy: e.target.value as PaydownStrategy,
                    biWeeklyPayments: false,
                    doubleMonthlyPrincipal: true,
                    extraMonthlyPrincipal: 0,
                    extraAnnualPayment: 0,
                    extraOneTimePayment: 0,
                  }))
                }
                className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">Double Principal</span>
                <Tooltip content="Pay double the principal portion of your payment each month, dramatically accelerating loan payoff.">
                  <HelpCircle size={16} className="text-gray-400 dark:text-gray-500" />
                </Tooltip>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    {/* Schedule Comparison Section - Full Width */}
    <div className="space-y-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Schedule Comparison</h2>

      {/* Summary Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          color="red"
          title="Original Schedule"
          metrics={[
            { label: 'Payoff Time', value: formatMonthsAsYearsMonths(standardSchedule.length) },
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
            { label: 'Payoff Time', value: formatMonthsAsYearsMonths(paydownSchedule.length) },
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
            { label: 'Time Saved', value: formatMonthsAsYearsMonths(standardSchedule.length - paydownSchedule.length) },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
