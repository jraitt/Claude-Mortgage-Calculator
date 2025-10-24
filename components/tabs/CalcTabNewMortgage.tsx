import React, { useState } from 'react';
import { DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { MortgageInputs } from '../MortgageCalculator';
import { FormField, SummaryCard } from '../shared';
import { formatCurrency } from '../../utils/formatting';

interface CalcTabNewMortgageProps {
  inputs: MortgageInputs;
  loanAmount: number;
  monthlyPI: number;
  monthlyPMI: number;
  monthlyEscrow: number;
  totalMonthlyPayment: number;
  ltvRatio: number;
  totalPayments: number;
  standardSchedule: any[];
  updateInput: (field: string, value: string) => void;
}

export const CalcTabNewMortgage: React.FC<CalcTabNewMortgageProps> = ({
  inputs,
  loanAmount,
  monthlyPI,
  monthlyPMI,
  monthlyEscrow,
  totalMonthlyPayment,
  ltvRatio,
  totalPayments,
  standardSchedule,
  updateInput,
}) => {
  const [showAmortization, setShowAmortization] = useState(false);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <DollarSign size={24} />
              Loan Details
            </h2>
            {typeof window !== 'undefined' && localStorage.getItem('mortgageCalculatorInputs') && (
              <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
                ✓ Previous data loaded
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <FormField
              label="Home Price"
              type="number"
              value={inputs.homePrice}
              onChange={(value) => updateInput('homePrice', value)}
            />

            <div>
              <FormField
                label="Down Payment"
                type="number"
                value={inputs.downPayment}
                onChange={(value) => updateInput('downPayment', value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {((inputs.downPayment / inputs.homePrice) * 100 || 0).toFixed(1)}% down
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Interest Rate (%)"
                type="number"
                step="0.01"
                value={inputs.interestRate}
                onChange={(value) => updateInput('interestRate', value)}
              />

              <FormField
                label="Loan Term (years)"
                type="select"
                value={inputs.loanTerm}
                onChange={(value) => updateInput('loanTerm', value)}
                options={[
                  { value: 15, label: '15 years' },
                  { value: 20, label: '20 years' },
                  { value: 25, label: '25 years' },
                  { value: 30, label: '30 years' },
                ]}
              />
            </div>

            {!inputs.isExistingLoan && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Annual Property Tax"
                  type="number"
                  value={inputs.propertyTax}
                  onChange={(value) => updateInput('propertyTax', value)}
                />

                <FormField
                  label="Annual Home Insurance"
                  type="number"
                  value={inputs.homeInsurance}
                  onChange={(value) => updateInput('homeInsurance', value)}
                />
              </div>
            )}

            <div>
              <FormField
                label={inputs.isExistingLoan ? 'PMI Amount $' : 'PMI Rate (% annual)'}
                type="number"
                step="0.01"
                value={inputs.isExistingLoan ? inputs.pmiAmount : inputs.pmiRate}
                onChange={(value) => updateInput(inputs.isExistingLoan ? 'pmiAmount' : 'pmiRate', value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {inputs.isExistingLoan
                  ? 'Monthly PMI payment amount'
                  : `${ltvRatio > 78 ? 'PMI Required' : 'No PMI Required'} (LTV: ${ltvRatio.toFixed(1)}%)`}
              </p>
            </div>

            {/* Key Ratios */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">Key Ratios</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Loan-to-Value (LTV):</span>
                  <span className="font-medium">{ltvRatio.toFixed(1)}%</span>
                </div>
                {!inputs.isExistingLoan && (
                  <>
                    <div className="flex justify-between">
                      <span>Down Payment %:</span>
                      <span className="font-medium">{((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Payment/Home Price:</span>
                      <span className="font-medium">{((totalMonthlyPayment / inputs.homePrice) * 100).toFixed(2)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Summary</h2>

          <div className="grid gap-4">
            <SummaryCard
              color="blue"
              title={inputs.isExistingLoan ? 'Current Balance' : 'Loan Amount'}
              metrics={[{ label: 'Amount', value: formatCurrency(loanAmount) }]}
            />

            <SummaryCard
              color="green"
              title="Principal & Interest"
              metrics={[{ label: 'Monthly', value: formatCurrency(monthlyPI) }]}
            />

            {monthlyPMI > 0 && (
              <SummaryCard
                color="yellow"
                title="Monthly PMI"
                metrics={[{ label: 'Amount', value: formatCurrency(monthlyPMI) }]}
              />
            )}

            <SummaryCard
              color="purple"
              title="Taxes & Insurance"
              metrics={[{ label: 'Monthly', value: formatCurrency(monthlyEscrow) }]}
            />

            <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg">
              <div className="text-sm text-gray-300 dark:text-gray-400">Total Monthly Payment</div>
              <div className="text-3xl font-bold dark:text-gray-100">{formatCurrency(totalMonthlyPayment)}</div>
            </div>
          </div>

          {/* Loan Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Loan Summary</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {inputs.isExistingLoan && (
                <>
                  <div className="flex justify-between">
                    <span>Original Principal:</span>
                    <span className="font-medium">{formatCurrency(inputs.originalPrincipal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payments Made:</span>
                    <span className="font-medium">{inputs.paymentsMade} of {inputs.loanTerm * 12}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Payments:</span>
                    <span className="font-medium">{totalPayments}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>{inputs.isExistingLoan ? 'Remaining Interest:' : 'Total Interest Paid:'}</span>
                <span className="font-medium">{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>{inputs.isExistingLoan ? 'Total Remaining Cost:' : 'Total Loan Cost:'}</span>
                <span className="font-medium">{formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>Payoff Date:</span>
                <span className="font-medium">
                  {new Date(Date.now() + standardSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Section - Full Width */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
        <button
          onClick={() => setShowAmortization(!showAmortization)}
          className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Amortization Schedule
          {showAmortization ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {showAmortization && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 mb-4">
              Total Payments: {standardSchedule.length} | Total Interest:{' '}
              {formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full border-collapse bg-white dark:bg-gray-800">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                  <tr>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Payment #</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Date</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Payment</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Principal</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Interest</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Balance</th>
                    <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">Total Interest</th>
                    {monthlyPMI > 0 && <th className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100">PMI</th>}
                  </tr>
                </thead>
                <tbody>
                  {standardSchedule.map((payment, index) => {
                    const paymentDate = new Date();
                    paymentDate.setMonth(paymentDate.getMonth() + payment.month);

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${payment.month % 12 === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 font-medium text-gray-900 dark:text-gray-100">{payment.month}</td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
                          {paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100">{formatCurrency(payment.payment)}</td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-green-700 dark:text-green-400 font-medium">{formatCurrency(payment.principal)}</td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-red-600 dark:text-red-400">{formatCurrency(payment.interest)}</td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(payment.balance)}</td>
                        <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-red-700 dark:text-red-400">{formatCurrency(payment.totalInterest)}</td>
                        {monthlyPMI > 0 && (
                          <td className="border-b border-gray-100 dark:border-gray-700 p-3 text-yellow-600 dark:text-yellow-400">
                            {payment.pmi > 0 ? formatCurrency(payment.pmi) : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                <div className="text-green-600 dark:text-green-300 font-medium">Total Principal</div>
                <div className="text-green-800 dark:text-green-200 font-bold">{formatCurrency(loanAmount)}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <div className="text-red-600 dark:text-red-300 font-medium">Total Interest</div>
                <div className="text-red-800 dark:text-red-200 font-bold">{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-blue-600 dark:text-blue-300 font-medium">Total Payments</div>
                <div className="text-blue-800 dark:text-blue-200 font-bold">{formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
