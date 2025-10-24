// CSV Export Utility for Mortgage Calculator
import { MortgageInputs } from '../components/MortgageCalculator';

export type AmortizationPayment = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  extraPrincipal: number;
  balance: number;
  totalInterest: number;
  pmi: number;
  escrow: number;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const formatDate = (monthOffset: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const escapeCSVField = (field: string | number): string => {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const arrayToCSV = (data: (string | number)[][]): string => {
  return data.map(row => 
    row.map(field => escapeCSVField(field)).join(',')
  ).join('\n');
};

export const prepareLoanSummaryData = (
  inputs: MortgageInputs,
  loanAmount: number,
  monthlyPI: number,
  monthlyPMI: number,
  monthlyEscrow: number,
  totalMonthlyPayment: number,
  standardSchedule: AmortizationPayment[],
  paydownSchedule: AmortizationPayment[],
  hasPaydownStrategy: boolean
): (string | number)[][] => {
  const data: (string | number)[][] = [
    ['Mortgage Calculator Export'],
    [`Generated on: ${new Date().toLocaleString()}`],
    [''],
    ['LOAN DETAILS'],
  ];

  if (!inputs.isExistingLoan) {
    data.push(['Home Price', formatCurrency(inputs.homePrice)]);
    data.push(['Down Payment', formatCurrency(inputs.downPayment)]);
  }
  
  data.push(
    ['Loan Amount', formatCurrency(loanAmount)],
    ['Interest Rate', formatPercentage(inputs.interestRate)],
    ['Loan Term', `${inputs.loanTerm} years`],
    ['Monthly P&I', formatCurrency(monthlyPI)]
  );

  if (!inputs.isExistingLoan) {
    data.push(
      ['Property Tax (Annual)', formatCurrency(inputs.propertyTax)],
      ['Home Insurance (Annual)', formatCurrency(inputs.homeInsurance)]
    );
  }

  if (monthlyPMI > 0) {
    data.push(['PMI (Monthly)', formatCurrency(monthlyPMI)]);
  }

  if (!inputs.isExistingLoan) {
    data.push(['Total Monthly Payment', formatCurrency(totalMonthlyPayment)]);
  }

  if (inputs.isExistingLoan) {
    data.push(
      [''],
      ['EXISTING LOAN DETAILS'],
      ['Original Principal', formatCurrency(inputs.originalPrincipal)],
      ['Current Balance', formatCurrency(inputs.currentBalance)],
      ['Payments Made', `${inputs.paymentsMade} of ${inputs.loanTerm * 12}`],
      ['Remaining Payments', `${inputs.loanTerm * 12 - inputs.paymentsMade}`]
    );
  }

  if (hasPaydownStrategy) {
    data.push([''], ['PAYDOWN STRATEGY']);
    
    if (inputs.biWeeklyPayments) {
      data.push(
        ['Strategy', 'Bi-Weekly Payments'],
        ['Bi-Weekly Payment Amount', formatCurrency(monthlyPI / 2)],
        ['Annual Payment Total', formatCurrency((monthlyPI / 2) * 26)]
      );
    } else if (inputs.doubleMonthlyPrincipal) {
      data.push(
        ['Strategy', 'Double Monthly Principal'],
        ['Extra Principal Payment', formatCurrency(monthlyPI - (loanAmount * (inputs.interestRate / 100 / 12)))],
        ['Total Monthly Payment', formatCurrency(monthlyPI + (monthlyPI - (loanAmount * (inputs.interestRate / 100 / 12))))]
      );
    } else {
      data.push(['Strategy', 'Extra Payments']);
      if (inputs.extraMonthlyPrincipal > 0) {
        data.push(['Extra Monthly Principal', formatCurrency(inputs.extraMonthlyPrincipal)]);
      }
      if (inputs.extraAnnualPayment > 0) {
        data.push(['Extra Annual Payment', formatCurrency(inputs.extraAnnualPayment)]);
      }
    }

    data.push([''], ['SAVINGS SUMMARY']);
    const interestSaved = (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) - 
                         (paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0);
    const timeSaved = standardSchedule.length - paydownSchedule.length;
    
    data.push(
      ['Original Payoff Time', `${standardSchedule.length} months`],
      ['New Payoff Time', `${paydownSchedule.length} months`],
      ['Time Saved', `${timeSaved} months`],
      ['Interest Saved', formatCurrency(interestSaved)],
      ['New Payoff Date', formatDate(paydownSchedule.length)]
    );
  } else {
    data.push([''], ['LOAN SUMMARY']);
    data.push(
      ['Total Payments', `${standardSchedule.length} months`],
      ['Total Interest', formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)],
      ['Total Cost', formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))],
      ['Payoff Date', formatDate(standardSchedule.length)]
    );
  }

  return data;
};

export const prepareAmortizationData = (
  standardSchedule: AmortizationPayment[],
  paydownSchedule: AmortizationPayment[],
  hasPaydownStrategy: boolean,
  monthlyPMI: number
): (string | number)[][] => {
  const data: (string | number)[][] = [
    [''],
    ['AMORTIZATION SCHEDULE' + (hasPaydownStrategy ? ' COMPARISON' : '')]
  ];

  if (hasPaydownStrategy) {
    // Side-by-side comparison headers
    const headers = [
      'Payment #',
      'Date',
      'Standard Payment',
      'Standard Principal',
      'Standard Interest',
      'Standard Balance',
      'Paydown Payment',
      'Paydown Principal', 
      'Paydown Interest',
      'Paydown Balance',
      'Interest Savings'
    ];

    if (monthlyPMI > 0) {
      headers.splice(6, 0, 'Standard PMI');
      headers.splice(11, 0, 'Paydown PMI');
    }

    data.push(headers);

    // Generate comparison data
    const maxLength = Math.max(standardSchedule.length, paydownSchedule.length);
    let cumulativeInterestSavings = 0;

    for (let i = 0; i < maxLength; i++) {
      const standardPayment = standardSchedule[i];
      const paydownPayment = paydownSchedule[i];
      
      if (standardPayment && paydownPayment) {
        const interestSavings = standardPayment.interest - paydownPayment.interest;
        cumulativeInterestSavings += interestSavings;

        const row = [
          standardPayment.month,
          formatDate(standardPayment.month),
          formatCurrency(standardPayment.payment),
          formatCurrency(standardPayment.principal),
          formatCurrency(standardPayment.interest),
          formatCurrency(standardPayment.balance),
          formatCurrency(paydownPayment.payment),
          formatCurrency(paydownPayment.principal),
          formatCurrency(paydownPayment.interest),
          formatCurrency(paydownPayment.balance),
          formatCurrency(cumulativeInterestSavings)
        ];

        if (monthlyPMI > 0) {
          row.splice(6, 0, standardPayment.pmi > 0 ? formatCurrency(standardPayment.pmi) : '—');
          row.splice(11, 0, paydownPayment.pmi > 0 ? formatCurrency(paydownPayment.pmi) : '—');
        }

        data.push(row);
      } else if (standardPayment && !paydownPayment) {
        // Paydown loan is paid off, only standard remains
        const row = [
          standardPayment.month,
          formatDate(standardPayment.month),
          formatCurrency(standardPayment.payment),
          formatCurrency(standardPayment.principal),
          formatCurrency(standardPayment.interest),
          formatCurrency(standardPayment.balance),
          'PAID OFF',
          '—',
          '—',
          '$0.00',
          formatCurrency(cumulativeInterestSavings + standardPayment.interest)
        ];

        if (monthlyPMI > 0) {
          row.splice(6, 0, standardPayment.pmi > 0 ? formatCurrency(standardPayment.pmi) : '—');
          row.splice(11, 0, '—');
        }

        data.push(row);
        cumulativeInterestSavings += standardPayment.interest;
      }
    }
  } else {
    // Standard schedule only
    const headers = [
      'Payment #',
      'Date', 
      'Payment Amount',
      'Principal',
      'Interest',
      'Remaining Balance',
      'Total Interest Paid'
    ];

    if (monthlyPMI > 0) {
      headers.push('PMI');
    }

    data.push(headers);

    standardSchedule.forEach(payment => {
      const row = [
        payment.month,
        formatDate(payment.month),
        formatCurrency(payment.payment),
        formatCurrency(payment.principal),
        formatCurrency(payment.interest),
        formatCurrency(payment.balance),
        formatCurrency(payment.totalInterest)
      ];

      if (monthlyPMI > 0) {
        row.push(payment.pmi > 0 ? formatCurrency(payment.pmi) : '—');
      }

      data.push(row);
    });
  }

  return data;
};

export const generateMortgageCSV = (
  inputs: MortgageInputs,
  loanAmount: number,
  monthlyPI: number,
  monthlyPMI: number,
  monthlyEscrow: number,
  totalMonthlyPayment: number,
  standardSchedule: AmortizationPayment[],
  paydownSchedule: AmortizationPayment[]
): string => {
  const hasPaydownStrategy = inputs.biWeeklyPayments || 
                           inputs.doubleMonthlyPrincipal || 
                           inputs.extraMonthlyPrincipal > 0 || 
                           inputs.extraAnnualPayment > 0;

  const summaryData = prepareLoanSummaryData(
    inputs,
    loanAmount,
    monthlyPI,
    monthlyPMI,
    monthlyEscrow,
    totalMonthlyPayment,
    standardSchedule,
    paydownSchedule,
    hasPaydownStrategy
  );

  const scheduleData = prepareAmortizationData(
    standardSchedule,
    paydownSchedule,
    hasPaydownStrategy,
    monthlyPMI
  );

  const allData = [...summaryData, ...scheduleData];
  return arrayToCSV(allData);
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const generateFilename = (tabType: string): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  const prefixMap: { [key: string]: string } = {
    'calculator': 'new-mortgage',
    'strategies': 'existing-mortgage',
    'points-calculator': 'points-analysis',
    'refinance-calculator': 'refinance-analysis'
  };
  
  const prefix = prefixMap[tabType] || 'mortgage-data';
  return `${prefix}-${dateStr}-${timeStr}.csv`;
};

// Points Calculator CSV Export
export const generatePointsCSV = (
  scenarios: any[],
  comparisonResults: any[],
  loanAmount: number,
  loanTerm: number
): string => {
  const data: (string | number)[][] = [
    ['Mortgage Points Analysis Export'],
    [`Generated on: ${new Date().toLocaleString()}`],
    [''],
    ['LOAN DETAILS'],
    ['Loan Amount', formatCurrency(loanAmount)],
    ['Loan Term', `${loanTerm} years`],
    [''],
    ['SCENARIOS COMPARISON']
  ];

  // Headers for scenarios
  const headers = [
    'Scenario Name',
    'Interest Rate',
    'Points',
    'Point Cost',
    'Monthly P&I',
    'Break-even (Months)',
    'Monthly Savings',
    'Total Cost (5 Years)',
    'Total Cost (10 Years)',
    'Total Cost (Full Term)'
  ];
  data.push(headers);

  // Add each scenario's data
  comparisonResults.forEach(result => {
    const row = [
      result.scenario.name,
      formatPercentage(result.scenario.rate),
      result.scenario.points.toFixed(2),
      formatCurrency(result.pointCost),
      formatCurrency(result.monthlyPI),
      result.breakEvenMonths ? `${result.breakEvenMonths} months` : 'N/A',
      formatCurrency(result.monthlySavings),
      formatCurrency(result.totalCostAt5Years),
      formatCurrency(result.totalCostAt10Years),
      formatCurrency(result.totalCostAtFullTerm)
    ];
    data.push(row);
  });

  return arrayToCSV(data);
};

// Refinance Calculator CSV Export
export const generateRefinanceCSV = (
  refinanceInputs: any,
  refinanceResult: any
): string => {
  const data: (string | number)[][] = [
    ['Refinance Analysis Export'],
    [`Generated on: ${new Date().toLocaleString()}`],
    [''],
    ['CURRENT LOAN DETAILS'],
    ['Current Balance', formatCurrency(refinanceInputs.currentBalance)],
    ['Current Rate', formatPercentage(refinanceInputs.currentRate)],
    ['Current Monthly Payment', formatCurrency(refinanceInputs.currentMonthlyPayment)],
    ['Remaining Months', `${refinanceInputs.remainingMonths} months`],
    [''],
    ['NEW LOAN DETAILS'],
    ['New Rate', formatPercentage(refinanceInputs.newRate)],
    ['New Term', `${refinanceInputs.newTerm} years`],
    ['Closing Costs', formatCurrency(refinanceInputs.closingCosts)],
    ['Cash Out', formatCurrency(refinanceInputs.cashOut)],
    ['Points', refinanceInputs.newPoints.toFixed(2)],
    [''],
    ['REFINANCE ANALYSIS'],
    ['New Monthly Payment', formatCurrency(refinanceResult.newMonthlyPayment)],
    ['Monthly Savings', formatCurrency(refinanceResult.monthlySavings)],
    ['Break-even Point', `${refinanceResult.breakEvenMonths} months`],
    ['Interest Savings', formatCurrency(refinanceResult.interestSavings)],
    ['Net Savings', formatCurrency(refinanceResult.netSavings)],
    [''],
    ['COST COMPARISON'],
    ['Cost at 5 Years', formatCurrency(refinanceResult.costAt5Years)],
    ['Cost at 10 Years', formatCurrency(refinanceResult.costAt10Years)],
    ['Cost at Full Term', formatCurrency(refinanceResult.costAtFullTerm)],
    [''],
    ['RECOMMENDATION'],
    [refinanceResult.recommendation]
  ];

  return arrayToCSV(data);
};

// New Mortgage CSV Export (simplified version of existing function)
export const generateNewMortgageCSV = (
  inputs: any,
  loanAmount: number,
  monthlyPI: number,
  monthlyPMI: number,
  monthlyEscrow: number,
  totalMonthlyPayment: number,
  standardSchedule: AmortizationPayment[]
): string => {
  const data: (string | number)[][] = [
    ['New Mortgage Analysis Export'],
    [`Generated on: ${new Date().toLocaleString()}`],
    [''],
    ['LOAN DETAILS'],
    ['Home Price', formatCurrency(inputs.homePrice)],
    ['Down Payment', formatCurrency(inputs.downPayment)],
    ['Loan Amount', formatCurrency(loanAmount)],
    ['Interest Rate', formatPercentage(inputs.interestRate)],
    ['Loan Term', `${inputs.loanTerm} years`],
    ['Monthly P&I', formatCurrency(monthlyPI)],
    ['Property Tax (Annual)', formatCurrency(inputs.propertyTax)],
    ['Home Insurance (Annual)', formatCurrency(inputs.homeInsurance)]
  ];

  if (monthlyPMI > 0) {
    data.push(['PMI (Monthly)', formatCurrency(monthlyPMI)]);
  }

  data.push(
    ['Total Monthly Payment', formatCurrency(totalMonthlyPayment)],
    [''],
    ['LOAN SUMMARY'],
    ['Total Payments', `${standardSchedule.length} months`],
    ['Total Interest', formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)],
    ['Total Cost', formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))],
    ['Payoff Date', formatDate(standardSchedule.length)]
  );

  // Add amortization schedule
  data.push([''], ['AMORTIZATION SCHEDULE']);
  const scheduleHeaders = [
    'Payment #',
    'Date',
    'Payment Amount',
    'Principal',
    'Interest',
    'Remaining Balance',
    'Total Interest Paid'
  ];

  if (monthlyPMI > 0) {
    scheduleHeaders.push('PMI');
  }

  data.push(scheduleHeaders);

  standardSchedule.forEach(payment => {
    const row = [
      payment.month,
      formatDate(payment.month),
      formatCurrency(payment.payment),
      formatCurrency(payment.principal),
      formatCurrency(payment.interest),
      formatCurrency(payment.balance),
      formatCurrency(payment.totalInterest)
    ];

    if (monthlyPMI > 0) {
      row.push(payment.pmi > 0 ? formatCurrency(payment.pmi) : '—');
    }

    data.push(row);
  });

  return arrayToCSV(data);
};