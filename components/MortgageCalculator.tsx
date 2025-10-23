'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, Home, TrendingDown, DollarSign, Calendar, GitCompare, Download, Sun, Moon, Scale, RefreshCw } from 'lucide-react';
import { generateMortgageCSV, downloadCSV, generateFilename } from '../utils/csvExport';
import { useTheme } from '../contexts/ThemeContext';
import {
  BREAK_EVEN_EXCELLENT,
  BREAK_EVEN_GOOD,
  BREAK_EVEN_MARGINAL,
  TIME_HORIZON_5_YEARS,
  TIME_HORIZON_10_YEARS,
  MINIMUM_BALANCE,
  MAX_ITERATIONS,
  PMI_LTV_THRESHOLD,
  BIWEEKLY_PERIODS_PER_YEAR
} from '../utils/constants';
import { validateRefinanceInputs, isValidPrincipalPayment } from '../utils/validation';
// Import extracted utilities for calculations and formatting
import { calculateBasicMetrics } from '../utils/calculations/basicCalculations';
import { generateAmortizationSchedule } from '../utils/calculations/amortizationSchedule';
import { calculateComparisonResults } from '../utils/calculations/pointsCalculations';
import { calculateRefinanceAnalysis } from '../utils/calculations/refinanceCalculations';
import { formatCurrency, formatNumber } from '../utils/formatting';

// Define the type for mortgage calculator inputs
export type MortgageInputs = {
  homePrice: number;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
  propertyTax: number;
  homeInsurance: number;
  pmiRate: number;
  pmiAmount: number;
  extraMonthlyPrincipal: number;
  doubleMonthlyPrincipal: boolean;
  extraAnnualPayment: number;
  biWeeklyPayments: boolean;
  isExistingLoan: boolean;
  loanStartDate: string;
  originalPrincipal: number;
  currentBalance: number;
  paymentsMade: number;
};

// Points calculator types
export type PointsScenario = {
  id: string;
  name: string;
  rate: number;           // Interest rate %
  points: number;         // Points as % of loan amount
  isBaseline: boolean;    // Mark one as the comparison baseline
};

export type ComparisonResult = {
  scenario: PointsScenario;
  monthlyPI: number;
  pointCost: number;
  totalInterest: number;
  totalCost: number;
  breakEvenMonths: number | null; // vs baseline
  monthlySavings: number;
  totalCostAt5Years: number;
  totalCostAt10Years: number;
  totalCostAtFullTerm: number;
};

// Refinance calculator types
export type RefinanceInputs = {
  currentBalance: number;
  currentRate: number;
  currentMonthlyPayment: number;
  remainingMonths: number;
  newRate: number;
  newTerm: number; // in years
  closingCosts: number;
  cashOut: number;
  newPoints: number;
};

export type RefinanceResult = {
  newMonthlyPayment: number;
  monthlySavings: number;
  totalClosingCosts: number;
  breakEvenMonths: number;
  currentTotalInterest: number;
  newTotalInterest: number;
  interestSavings: number;
  currentTotalCost: number;
  newTotalCost: number;
  netSavings: number;
  costAt5Years: number;
  costAt10Years: number;
  costAtFullTerm: number;
  recommendation: string;
};

const MortgageCalculator = () => {
  const { theme, toggleTheme } = useTheme();

  // Default values
  const defaultInputs: MortgageInputs = {
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    propertyTax: 8000,
    homeInsurance: 1200,
    pmiRate: 0.5,
    pmiAmount: 0,
    extraMonthlyPrincipal: 0,
    doubleMonthlyPrincipal: false,
    extraAnnualPayment: 0,
    biWeeklyPayments: false,
    // New/existing loan fields
    isExistingLoan: false,
    loanStartDate: new Date().toISOString().split('T')[0],
    originalPrincipal: 320000,
    currentBalance: 300000,
    paymentsMade: 24
  };

  // Load saved inputs from localStorage or use defaults
  const loadSavedInputs = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mortgageCalculatorInputs');
        if (saved) {
          const parsedInputs = JSON.parse(saved);
          // Ensure all required fields exist (in case we add new fields in the future)
          return { ...defaultInputs, ...parsedInputs };
        }
      } catch (error) {
        console.warn('Failed to load saved mortgage calculator inputs:', error);
      }
    }
    return defaultInputs;
  };

  const [inputs, setInputs] = useState<MortgageInputs>(loadSavedInputs);
  const [activeTab, setActiveTab] = useState('calculator');
  const [scrollLocked, setScrollLocked] = useState(true);

  // Load saved scenarios from localStorage or use defaults
  const loadSavedScenarios = (): PointsScenario[] => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pointsCalculatorScenarios');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Failed to load saved points calculator scenarios:', error);
      }
    }
    // Default scenarios from your screenshot
    return [
      {
        id: '1',
        name: '0 Points',
        rate: 5.625,
        points: 0,
        isBaseline: true
      },
      {
        id: '2',
        name: '1.0 Points',
        rate: 5.375,
        points: 1.0,
        isBaseline: false
      },
      {
        id: '3',
        name: '1.625 Points',
        rate: 5.25,
        points: 1.625,
        isBaseline: false
      }
    ];
  };

  // Points calculator state
  const [scenarios, setScenarios] = useState<PointsScenario[]>(loadSavedScenarios);
  const [pointsCalcLoanAmount, setPointsCalcLoanAmount] = useState<number>(320000); // Default, will sync with loanAmount
  const [pointsCalcTerm, setPointsCalcTerm] = useState<number>(30); // Default, will sync with inputs.loanTerm

  // Refinance calculator state
  const [refinanceInputs, setRefinanceInputs] = useState<RefinanceInputs>({
    currentBalance: 0,
    currentRate: 0,
    currentMonthlyPayment: 0,
    remainingMonths: 0,
    newRate: 5.5,
    newTerm: 30,
    closingCosts: 3000,
    cashOut: 0,
    newPoints: 0
  });
  const [refinanceValidationErrors, setRefinanceValidationErrors] = useState<string[]>([]);

  // Save inputs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mortgageCalculatorInputs', JSON.stringify(inputs));
      } catch (error) {
        console.warn('Failed to save mortgage calculator inputs:', error);
      }
    }
  }, [inputs]);

  // Save scenarios to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pointsCalculatorScenarios', JSON.stringify(scenarios));
      } catch (error) {
        console.warn('Failed to save points calculator scenarios:', error);
      }
    }
  }, [scenarios]);

  // Reset all inputs to defaults
  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all fields to their default values? This will clear your saved data.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mortgageCalculatorInputs');
        localStorage.removeItem('pointsCalculatorScenarios');
      }
      setInputs(defaultInputs);
      setScenarios(loadSavedScenarios());
      setPointsCalcLoanAmount(320000);
      setPointsCalcTerm(20);
    }
  };

  // Download CSV report
  const handleDownloadCSV = () => {
    try {
      const hasPaydownStrategy = inputs.biWeeklyPayments || 
                               inputs.doubleMonthlyPrincipal || 
                               inputs.extraMonthlyPrincipal > 0 || 
                               inputs.extraAnnualPayment > 0;

      const csvContent = generateMortgageCSV(
        inputs,
        loanAmount,
        monthlyPI,
        monthlyPMI,
        monthlyEscrow,
        totalMonthlyPayment,
        standardSchedule,
        paydownSchedule
      );

      const filename = generateFilename(hasPaydownStrategy);
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Failed to generate CSV:', error);
      alert('Failed to generate CSV report. Please try again.');
    }
  };
  
  // Refs for synchronized scrolling
  const standardTableRef = useRef<HTMLDivElement>(null);
  const paydownTableRef = useRef<HTMLDivElement>(null);

  // Calculate loan details
  const loanAmount = inputs.isExistingLoan ? inputs.currentBalance : inputs.homePrice - inputs.downPayment;
  const monthlyRate = (inputs.interestRate || 0) / 100 / 12;
  const totalPayments = inputs.isExistingLoan ?
    (inputs.loanTerm * 12) - inputs.paymentsMade :
    inputs.loanTerm * 12;

  // Monthly principal and interest payment
  // Handle zero interest rate case
  const monthlyPI = monthlyRate === 0
    ? loanAmount / totalPayments
    : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  // PMI calculation (removed when loan-to-value reaches 78%)
  const ltvRatio = inputs.isExistingLoan ?
    (inputs.originalPrincipal > 0 ? (inputs.currentBalance / inputs.originalPrincipal) * 100 : 0) :
    (inputs.homePrice > 0 ? (loanAmount / inputs.homePrice) * 100 : 0);
  const monthlyPMI = inputs.isExistingLoan ?
    (inputs.pmiAmount || 0) :
    (ltvRatio > PMI_LTV_THRESHOLD ? (loanAmount * ((inputs.pmiRate || 0) / 100)) / 12 : 0);

  // Monthly escrow (taxes + insurance)
  const monthlyEscrow = inputs.isExistingLoan ? 0 : ((inputs.propertyTax || 0) + (inputs.homeInsurance || 0)) / 12;
  
  // Total monthly payment
  const totalMonthlyPayment = monthlyPI + monthlyPMI + monthlyEscrow;

  // Generate amortization schedule
  const generateAmortizationSchedule = (extraMonthly = 0, doubleMonthly = false, extraAnnual = 0, biWeekly = false) => {
    const schedule = [];
    let remainingBalance = loanAmount;
    let totalInterestPaid = 0;

    if (biWeekly) {
      // Bi-weekly payments: 26 payments per year = 13 monthly payments
      const biWeeklyPayment = monthlyPI / 2;
      const biWeeklyRate = inputs.interestRate / 100 / BIWEEKLY_PERIODS_PER_YEAR;
      let paymentNumber = 1;
      const maxPayments = Math.min(totalPayments * 2, MAX_ITERATIONS);

      while (remainingBalance > MINIMUM_BALANCE && paymentNumber <= maxPayments) {
        const interestPayment = remainingBalance * biWeeklyRate;
        let principalPayment = biWeeklyPayment - interestPayment;

        // Safety check: prevent negative principal payments
        if (principalPayment <= 0) {
          console.warn('Bi-weekly payment too low to cover interest. Stopping amortization.');
          break;
        }

        // Don't pay more than remaining balance
        principalPayment = Math.min(principalPayment, remainingBalance);

        remainingBalance -= principalPayment;
        totalInterestPaid += interestPayment;

        // Add to schedule every 2 payments (monthly equivalent)
        if (paymentNumber % 2 === 0) {
          const currentLTV = inputs.isExistingLoan ?
            (remainingBalance / inputs.originalPrincipal) * 100 :
            (remainingBalance / inputs.homePrice) * 100;
          const pmiPayment = inputs.isExistingLoan ?
            (remainingBalance > 0 ? monthlyPMI : 0) :
            (currentLTV > PMI_LTV_THRESHOLD ? monthlyPMI : 0);

          schedule.push({
            month: Math.ceil(paymentNumber / 2),
            payment: biWeeklyPayment * 2,
            principal: principalPayment * 2, // Approximate for display
            interest: interestPayment * 2, // Approximate for display
            extraPrincipal: 0,
            balance: remainingBalance,
            totalInterest: totalInterestPaid,
            pmi: pmiPayment,
            escrow: monthlyEscrow
          });
        }

        paymentNumber++;
      }
    } else {
      // Standard monthly payments
      const maxMonths = Math.min(totalPayments, MAX_ITERATIONS);
      for (let month = 1; month <= maxMonths && remainingBalance > MINIMUM_BALANCE; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = monthlyPI - interestPayment;

        // Safety check: prevent negative principal payments
        if (principalPayment <= 0) {
          console.warn('Monthly payment too low to cover interest. Stopping amortization.');
          break;
        }

        // Add extra payments
        let extraPrincipal = extraMonthly;
        if (doubleMonthly) {
          extraPrincipal += principalPayment;
        }
        if (month % 12 === 0) {
          extraPrincipal += extraAnnual;
        }

        // Don't pay more than remaining balance
        const totalPrincipal = Math.min(principalPayment + extraPrincipal, remainingBalance);

        remainingBalance -= totalPrincipal;
        totalInterestPaid += interestPayment;

        const currentLTV = inputs.isExistingLoan ?
          (remainingBalance / inputs.originalPrincipal) * 100 :
          (remainingBalance / inputs.homePrice) * 100;
        const pmiPayment = inputs.isExistingLoan ?
          (remainingBalance > 0 ? monthlyPMI : 0) :
          (currentLTV > PMI_LTV_THRESHOLD ? monthlyPMI : 0);

        schedule.push({
          month,
          payment: monthlyPI + extraPrincipal,
          principal: totalPrincipal,
          interest: interestPayment,
          extraPrincipal,
          balance: remainingBalance,
          totalInterest: totalInterestPaid,
          pmi: pmiPayment,
          escrow: monthlyEscrow
        });
      }
    }
    
    return schedule;
  };

  // Standard schedule and paydown scenarios
  const standardSchedule = useMemo(() => generateAmortizationSchedule(), [inputs]);
  const paydownSchedule = useMemo(() =>
    generateAmortizationSchedule(
      inputs.extraMonthlyPrincipal,
      inputs.doubleMonthlyPrincipal,
      inputs.extraAnnualPayment,
      inputs.biWeeklyPayments
    ), [inputs]);

  // Sync points calculator loan amount and term with main calculator when switching to that tab
  useEffect(() => {
    if (activeTab === 'points-calculator') {
      setPointsCalcLoanAmount(loanAmount);
      setPointsCalcTerm(inputs.loanTerm);
    }
  }, [activeTab, loanAmount, inputs.loanTerm]);

  // Sync refinance calculator with current loan details when switching to that tab
  useEffect(() => {
    if (activeTab === 'refinance-calculator') {
      const remainingMonths = inputs.isExistingLoan
        ? (inputs.loanTerm * 12) - inputs.paymentsMade
        : inputs.loanTerm * 12;

      setRefinanceInputs(prev => ({
        ...prev,
        currentBalance: loanAmount,
        currentRate: inputs.interestRate,
        currentMonthlyPayment: monthlyPI,
        remainingMonths: remainingMonths
      }));
    }
  }, [activeTab, loanAmount, inputs.interestRate, monthlyPI, inputs.loanTerm, inputs.isExistingLoan, inputs.paymentsMade]);

  // Points Comparison Calculation Functions
  const calculateScenarioMetrics = (scenario: PointsScenario, loanAmt: number, term: number): ComparisonResult => {
    const monthlyRate = scenario.rate / 100 / 12;
    const totalPayments = term * 12;

    // Calculate monthly P&I
    const monthlyPI = monthlyRate === 0
      ? loanAmt / totalPayments
      : loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
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
    const totalCost = pointCost + (monthlyPI * totalPayments);

    // Calculate total cost at different time horizons
    const calculateCostAtMonth = (months: number) => {
      let balance = loanAmt;
      const paymentsToCalculate = Math.min(months, totalPayments);

      for (let m = 1; m <= paymentsToCalculate; m++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPI - interest;
        balance -= principal;
      }

      return pointCost + (monthlyPI * paymentsToCalculate);
    };

    return {
      scenario,
      monthlyPI,
      pointCost,
      totalInterest,
      totalCost,
      breakEvenMonths: null, // Calculated separately vs baseline
      monthlySavings: 0, // Calculated separately vs baseline
      totalCostAt5Years: calculateCostAtMonth(60),
      totalCostAt10Years: calculateCostAtMonth(120),
      totalCostAtFullTerm: totalCost
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
      breakEvenMonths
    };
  };

  // Calculate comparison results for all scenarios
  const comparisonResults = useMemo(() => {
    const baseline = scenarios.find(s => s.isBaseline);
    if (!baseline) return [];

    const baselineResult = calculateScenarioMetrics(baseline, pointsCalcLoanAmount, pointsCalcTerm);
    const results = scenarios.map(scenario => {
      const result = calculateScenarioMetrics(scenario, pointsCalcLoanAmount, pointsCalcTerm);
      return scenario.isBaseline ? result : calculateBreakEven(result, baselineResult);
    });

    return results;
  }, [scenarios, pointsCalcLoanAmount, pointsCalcTerm]);

  // Refinance Calculator Calculation Functions
  const calculateRefinanceAnalysis = (refInputs: RefinanceInputs): RefinanceResult => {
    // New loan amount (current balance + cash out + points cost)
    const pointsCost = refInputs.currentBalance * (refInputs.newPoints / 100);
    const newLoanAmount = refInputs.currentBalance + refInputs.cashOut + pointsCost;
    const totalClosingCosts = refInputs.closingCosts + pointsCost;

    // Calculate new monthly payment
    const newMonthlyRate = refInputs.newRate / 100 / 12;
    const newTotalPayments = refInputs.newTerm * 12;

    const newMonthlyPayment = newMonthlyRate === 0
      ? newLoanAmount / newTotalPayments
      : newLoanAmount * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newTotalPayments)) /
        (Math.pow(1 + newMonthlyRate, newTotalPayments) - 1);

    // Monthly savings
    const monthlySavings = refInputs.currentMonthlyPayment - newMonthlyPayment;

    // Break-even calculation (months to recover closing costs)
    const breakEvenMonths = monthlySavings > 0 ? totalClosingCosts / monthlySavings : Infinity;

    // Calculate total interest for current loan (remaining term)
    let currentTotalInterest = 0;
    let currentBalance = refInputs.currentBalance;
    const currentMonthlyRate = refInputs.currentRate / 100 / 12;
    const maxCurrentMonths = Math.min(refInputs.remainingMonths, MAX_ITERATIONS);

    for (let month = 1; month <= maxCurrentMonths && currentBalance > MINIMUM_BALANCE; month++) {
      const interestPayment = currentBalance * currentMonthlyRate;
      const principalPayment = refInputs.currentMonthlyPayment - interestPayment;

      // Safety check: prevent negative principal payments from causing infinite loop
      if (principalPayment <= 0) {
        console.warn('Current loan payment too low to cover interest. Stopping calculation.');
        break;
      }

      currentTotalInterest += interestPayment;
      currentBalance -= principalPayment;
    }

    // Calculate total interest for new loan
    let newTotalInterest = 0;
    let newBalance = newLoanAmount;
    const maxNewMonths = Math.min(newTotalPayments, MAX_ITERATIONS);

    for (let month = 1; month <= maxNewMonths && newBalance > MINIMUM_BALANCE; month++) {
      const interestPayment = newBalance * newMonthlyRate;
      const principalPayment = newMonthlyPayment - interestPayment;

      // Safety check: prevent negative principal payments from causing infinite loop
      if (principalPayment <= 0) {
        console.warn('New loan payment too low to cover interest. Stopping calculation.');
        break;
      }

      newTotalInterest += interestPayment;
      newBalance -= principalPayment;
    }

    // Total costs
    const currentTotalCost = currentTotalInterest + (refInputs.currentMonthlyPayment * refInputs.remainingMonths);
    const newTotalCost = totalClosingCosts + newTotalInterest + (newMonthlyPayment * newTotalPayments);

    const interestSavings = currentTotalInterest - newTotalInterest;
    const netSavings = currentTotalCost - newTotalCost;

    // Calculate costs at different time horizons
    const calculateCostAtMonths = (months: number) => {
      const monthsToCalc = Math.min(months, newTotalPayments, MAX_ITERATIONS);
      let balance = newLoanAmount;

      for (let m = 1; m <= monthsToCalc && balance > MINIMUM_BALANCE; m++) {
        const interest = balance * newMonthlyRate;
        const principal = newMonthlyPayment - interest;

        // Safety check
        if (principal <= 0) break;

        balance -= principal;
      }

      return totalClosingCosts + (newMonthlyPayment * monthsToCalc);
    };

    const costAt5Years = calculateCostAtMonths(TIME_HORIZON_5_YEARS);
    const costAt10Years = calculateCostAtMonths(TIME_HORIZON_10_YEARS);
    const costAtFullTerm = newTotalCost;

    // Generate recommendation using named constants
    let recommendation = '';
    if (breakEvenMonths < BREAK_EVEN_EXCELLENT) {
      recommendation = 'Excellent! You\'ll break even in less than 2 years. This refinance is highly recommended.';
    } else if (breakEvenMonths < BREAK_EVEN_GOOD) {
      recommendation = 'Good opportunity. You\'ll break even in ' + Math.round(breakEvenMonths / 12) + ' years. Worth refinancing if you plan to stay longer.';
    } else if (breakEvenMonths < BREAK_EVEN_MARGINAL) {
      recommendation = 'Marginal benefit. Break-even takes ' + Math.round(breakEvenMonths / 12) + ' years. Only refinance if you\'re certain you\'ll keep the loan that long.';
    } else if (monthlySavings < 0) {
      recommendation = 'Not recommended. Your monthly payment would increase. Only consider if you need cash-out or to shorten the term.';
    } else {
      recommendation = 'Not recommended. The break-even period is too long to justify the closing costs.';
    }

    return {
      newMonthlyPayment,
      monthlySavings,
      totalClosingCosts,
      breakEvenMonths,
      currentTotalInterest,
      newTotalInterest,
      interestSavings,
      currentTotalCost,
      newTotalCost,
      netSavings,
      costAt5Years,
      costAt10Years,
      costAtFullTerm,
      recommendation
    };
  };

  // Validate refinance inputs
  useEffect(() => {
    const validation = validateRefinanceInputs(refinanceInputs);
    setRefinanceValidationErrors(validation.errors);
  }, [refinanceInputs]);

  // Calculate refinance result
  const refinanceResult = useMemo(() => {
    return calculateRefinanceAnalysis(refinanceInputs);
  }, [refinanceInputs]);

  // Synchronized scroll handlers
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

  const updateInput = (field: string, value: string) => {
    setInputs((prev: MortgageInputs) => ({
      ...prev,
      [field]: value === '' ? 0 : (parseFloat(value) || 0)
    }));
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN and Infinity
    if (!isFinite(amount)) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    // Handle NaN and Infinity
    if (!isFinite(num)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-lg border-t-2 border-l-2 border-r-2 transition-all relative ${
        isActive
          ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-400 shadow-sm z-10 -mb-px'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-400'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home size={32} />
              <div>
                <h1 className="text-3xl font-bold">Mortgage Calculator</h1>
                <p className="text-blue-100 dark:text-blue-200 mt-1">Complete loan analysis with paydown strategies</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-blue-100 dark:text-blue-200 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Auto-saving your inputs
              </div>
              <button
                onClick={toggleTheme}
                className="bg-blue-500 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="bg-green-600 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Download mortgage report as CSV"
              >
                <Download size={16} />
                Download Report
              </button>
              <button
                onClick={resetToDefaults}
                className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Clear all saved data and reset to defaults"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-6 pt-4">
          <div className="flex space-x-1 -mb-px">
            <TabButton
              id="calculator"
              label="New Mortgage"
              icon={Calculator}
              isActive={activeTab === 'calculator'}
              onClick={setActiveTab}
            />
            <TabButton 
              id="schedule" 
              label="Amortization" 
              icon={Calendar} 
              isActive={activeTab === 'schedule'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              id="strategies" 
              label="Paydown Strategies" 
              icon={TrendingDown} 
              isActive={activeTab === 'strategies'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              id="comparison" 
              label="Schedule Comparison" 
              icon={GitCompare} 
              isActive={activeTab === 'comparison'} 
              onClick={setActiveTab} 
            />
            <TabButton
              id="points-calculator"
              label="Points Calculator"
              icon={Scale}
              isActive={activeTab === 'points-calculator'}
              onClick={setActiveTab}
            />
            <TabButton
              id="refinance-calculator"
              label="Refinance Calculator"
              icon={RefreshCw}
              isActive={activeTab === 'refinance-calculator'}
              onClick={setActiveTab}
            />
          </div>
        </div>

        <div className="p-6">
          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
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

                {/* New/Existing Loan Toggle */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="loanType"
                        checked={!inputs.isExistingLoan}
                        onChange={() => setInputs((prev: MortgageInputs) => ({ ...prev, isExistingLoan: false }))}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">New Loan</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="loanType"
                        checked={inputs.isExistingLoan}
                        onChange={() => setInputs((prev: MortgageInputs) => ({ ...prev, isExistingLoan: true }))}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Existing Loan</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {!inputs.isExistingLoan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Home Price</label>
                      <input
                        type="number"
                        value={inputs.homePrice || ''}
                        onChange={(e) => updateInput('homePrice', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  )}
                  
                  {/* Existing Loan Fields */}
                  {inputs.isExistingLoan && (
                    <>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Principal</label>
                          <input
                            type="number"
                            value={inputs.originalPrincipal || ''}
                            onChange={(e) => updateInput('originalPrincipal', e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Balance</label>
                          <input
                            type="number"
                            value={inputs.currentBalance || ''}
                            onChange={(e) => updateInput('currentBalance', e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payments Already Made</label>
                        <input
                          type="number"
                          value={inputs.paymentsMade || ''}
                          onChange={(e) => updateInput('paymentsMade', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {inputs.paymentsMade} of {inputs.loanTerm * 12} payments completed
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Down Payment - only show for new loans */}
                  {!inputs.isExistingLoan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Down Payment</label>
                      <input
                        type="number"
                        value={inputs.downPayment || ''}
                        onChange={(e) => updateInput('downPayment', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}% down
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={inputs.interestRate || ''}
                        onChange={(e) => updateInput('interestRate', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Term (years)</label>
                      <select
                        value={inputs.loanTerm}
                        onChange={(e) => updateInput('loanTerm', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      >
                        <option value={15}>15 years</option>
                        <option value={20}>20 years</option>
                        <option value={25}>25 years</option>
                        <option value={30}>30 years</option>
                      </select>
                    </div>
                  </div>
                  
                  {!inputs.isExistingLoan && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Annual Property Tax</label>
                        <input
                          type="number"
                          value={inputs.propertyTax || ''}
                          onChange={(e) => updateInput('propertyTax', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Annual Home Insurance</label>
                        <input
                          type="number"
                          value={inputs.homeInsurance || ''}
                          onChange={(e) => updateInput('homeInsurance', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {inputs.isExistingLoan ? 'PMI Amount $' : 'PMI Rate (% annual)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputs.isExistingLoan ? inputs.pmiAmount : inputs.pmiRate}
                      onChange={(e) => updateInput(inputs.isExistingLoan ? 'pmiAmount' : 'pmiRate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {inputs.isExistingLoan ?
                        'Monthly PMI payment amount' :
                        (ltvRatio > 78 ? 'PMI Required' : 'No PMI Required') + ' (LTV: ' + ltvRatio.toFixed(1) + '%)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Summary</h2>

                <div className="grid gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-300">{inputs.isExistingLoan ? 'Current Balance' : 'Loan Amount'}</div>
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(loanAmount)}</div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-600 dark:text-green-300">Principal & Interest</div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(monthlyPI)}</div>
                  </div>

                  {monthlyPMI > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-sm text-yellow-600 dark:text-yellow-300">Monthly PMI</div>
                      <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{formatCurrency(monthlyPMI)}</div>
                    </div>
                  )}

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-600 dark:text-purple-300">Taxes & Insurance</div>
                    <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{formatCurrency(monthlyEscrow)}</div>
                  </div>

                  <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg">
                    <div className="text-sm text-gray-300 dark:text-gray-400">Total Monthly Payment</div>
                    <div className="text-3xl font-bold dark:text-gray-100">{formatCurrency(totalMonthlyPayment)}</div>
                  </div>
                </div>
                
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
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Section - Moved from separate Analysis tab */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Loan Analysis</h2>

                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Payment Breakdown</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Principal & Interest</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full"
                                  style={{ width: `${(monthlyPI / totalMonthlyPayment) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(monthlyPI)}</span>
                            </div>
                          </div>

                          {monthlyPMI > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">PMI</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${(monthlyPMI / totalMonthlyPayment) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(monthlyPMI)}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Taxes & Insurance</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full"
                                  style={{ width: `${(monthlyEscrow / totalMonthlyPayment) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(monthlyEscrow)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Key Ratios</h3>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex justify-between">
                            <span>Loan-to-Value (LTV):</span>
                            <span className="font-medium">{ltvRatio.toFixed(1)}%</span>
                          </div>
                          {!inputs.isExistingLoan && (
                            <div className="flex justify-between">
                              <span>Down Payment %:</span>
                              <span className="font-medium">{((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}%</span>
                            </div>
                          )}
                          {!inputs.isExistingLoan && (
                            <div className="flex justify-between">
                              <span>Monthly Payment/Home Price:</span>
                              <span className="font-medium">{((totalMonthlyPayment / inputs.homePrice) * 100).toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Recommendations</h2>

                    <div className="space-y-4">
                      {ltvRatio > 80 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ PMI Alert</h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your loan-to-value ratio is {ltvRatio.toFixed(1)}%. Consider a larger down payment to avoid PMI,
                            or plan to pay extra principal to reach 78% LTV faster.
                          </p>
                        </div>
                      )}

                      {!inputs.isExistingLoan && ((inputs.downPayment / inputs.homePrice) * 100) < 20 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Down Payment Tip</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Increasing your down payment to 20% ({formatCurrency(inputs.homePrice * 0.2)}) would eliminate PMI
                            and save you {formatCurrency(monthlyPMI * 12)} per year.
                          </p>
                        </div>
                      )}

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🚀 Payoff Strategy</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Adding just {formatCurrency(100)} extra per month would save you approximately{' '}
                          {formatCurrency(
                            (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) -
                            (generateAmortizationSchedule(100)[generateAmortizationSchedule(100).length - 1]?.totalInterest || 0)
                          )} in interest over the life of the loan.
                        </p>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded border border-green-300 dark:border-green-700">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>💡 Bi-Weekly Tip:</strong> Switching to bi-weekly payments ({formatCurrency(monthlyPI / 2)} every 2 weeks)
                            would save you {formatCurrency(
                              (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) -
                              (generateAmortizationSchedule(0, false, 0, true)[generateAmortizationSchedule(0, false, 0, true).length - 1]?.totalInterest || 0)
                            )} in interest and pay off your loan {standardSchedule.length - generateAmortizationSchedule(0, false, 0, true).length} months earlier!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amortization Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Amortization Schedule</h2>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded border border-gray-200 dark:border-gray-600">
                  Total Payments: {standardSchedule.length} | Total Interest: {formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                        <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${payment.month % 12 === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
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

          {/* Paydown Strategies Tab */}
          {activeTab === 'strategies' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Paydown Options</h2>

                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={inputs.biWeeklyPayments}
                        onChange={(e) => setInputs((prev: MortgageInputs) => ({
                          ...prev,
                          biWeeklyPayments: e.target.checked,
                          // Disable other options when bi-weekly is selected
                          extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                          doubleMonthlyPrincipal: e.target.checked ? false : prev.doubleMonthlyPrincipal,
                          extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment
                        }))}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">Bi-Weekly Payments</span>
                    </label>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>How it works:</strong> Pay half your monthly payment ({formatCurrency(monthlyPI / 2)}) every two weeks.
                        This results in 26 payments per year (equivalent to 13 monthly payments), significantly reducing your loan term and interest.
                      </p>
                      {inputs.biWeeklyPayments && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600 dark:text-blue-300">Bi-weekly payment:</span>
                            <div className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency(monthlyPI / 2)}</div>
                          </div>
                          <div>
                            <span className="text-blue-600 dark:text-blue-300">Annual total:</span>
                            <div className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency((monthlyPI / 2) * 26)}</div>
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
                        onChange={(e) => setInputs((prev: MortgageInputs) => ({
                          ...prev,
                          doubleMonthlyPrincipal: e.target.checked,
                          // Disable other options when double monthly is selected
                          biWeeklyPayments: e.target.checked ? false : prev.biWeeklyPayments,
                          extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                          extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment
                        }))}
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                      />
                      <span className="text-lg font-semibold text-green-700 dark:text-green-300">Double Monthly Principal Payment</span>
                    </label>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-6">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>How it works:</strong> Pay an extra principal amount equal to your regular principal payment ({formatCurrency(monthlyPI - (loanAmount * monthlyRate))}).
                        This doubles the principal portion of each payment, dramatically reducing your loan term.
                      </p>
                      {inputs.doubleMonthlyPrincipal && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-600 dark:text-green-300">Regular principal:</span>
                            <div className="font-bold text-green-800 dark:text-green-200">{formatCurrency(monthlyPI - (loanAmount * monthlyRate))}</div>
                          </div>
                          <div>
                            <span className="text-green-600 dark:text-green-300">Total monthly payment:</span>
                            <div className="font-bold text-green-800 dark:text-green-200">{formatCurrency(monthlyPI + (monthlyPI - (loanAmount * monthlyRate)))}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!inputs.biWeeklyPayments && !inputs.doubleMonthlyPrincipal && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Extra Monthly Principal</label>
                        <input
                          type="number"
                          value={inputs.extraMonthlyPrincipal || ''}
                          onChange={(e) => updateInput('extraMonthlyPrincipal', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Extra Annual Payment</label>
                        <input
                          type="number"
                          value={inputs.extraAnnualPayment || ''}
                          onChange={(e) => updateInput('extraAnnualPayment', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                          placeholder="0"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Applied every December (bonus, tax refund, etc.)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Savings Comparison</h2>

                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Standard Loan</h3>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Payoff Time:</span>
                        <span>{standardSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span>{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      {inputs.biWeeklyPayments ? 'With Bi-Weekly Payments' :
                       inputs.doubleMonthlyPrincipal ? 'With Double Monthly Principal' : 'With Extra Payments'}
                    </h3>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Payoff Time:</span>
                        <span>{paydownSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span>{formatCurrency(paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0)}</span>
                      </div>
                      {inputs.biWeeklyPayments && (
                        <div className="flex justify-between">
                          <span>Payment Amount:</span>
                          <span>{formatCurrency(monthlyPI / 2)} bi-weekly</span>
                        </div>
                      )}
                      {inputs.doubleMonthlyPrincipal && (
                        <div className="flex justify-between">
                          <span>Monthly Payment:</span>
                          <span>{formatCurrency(monthlyPI + (monthlyPI - (loanAmount * monthlyRate)))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Savings Summary</h3>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Time Saved:</span>
                        <span className="font-bold">{standardSchedule.length - paydownSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Saved:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency((standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) -
                                       (paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Payoff Date:</span>
                        <span className="font-bold">
                          {new Date(Date.now() + paydownSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Schedule Comparison</h2>

              {/* Summary Comparison */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Original Schedule</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Payoff Time:</span>
                      <span className="font-medium">{standardSchedule.length} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span className="font-medium">{formatCurrency(monthlyPI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-medium">{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    {inputs.biWeeklyPayments ? 'Bi-Weekly Strategy' :
                     inputs.doubleMonthlyPrincipal ? 'Double Principal Strategy' :
                     (inputs.extraMonthlyPrincipal > 0 || inputs.extraAnnualPayment > 0) ? 'Extra Payment Strategy' : 'No Strategy Selected'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Payoff Time:</span>
                      <span className="font-medium">{paydownSchedule.length} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Amount:</span>
                      <span className="font-medium">
                        {inputs.biWeeklyPayments ? `${formatCurrency(monthlyPI / 2)} bi-weekly` :
                         inputs.doubleMonthlyPrincipal ? formatCurrency(monthlyPI + (monthlyPI - (loanAmount * monthlyRate))) :
                         formatCurrency(monthlyPI + inputs.extraMonthlyPrincipal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-medium">{formatCurrency(paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Savings</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Time Saved:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{standardSchedule.length - paydownSchedule.length} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Saved:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency((standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) -
                                     (paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Early Payoff:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {new Date(Date.now() + paydownSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
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
                          <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Month</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Payment</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Principal</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Interest</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standardSchedule.map((payment, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-2 text-gray-900 dark:text-gray-100">{payment.month}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.payment)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.principal)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.interest)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.balance)}</td>
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
                      {inputs.biWeeklyPayments ? 'Bi-Weekly Strategy' :
                       inputs.doubleMonthlyPrincipal ? 'Double Principal Strategy' :
                       'Enhanced Payment Strategy'}
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {inputs.biWeeklyPayments ? 'Payment every 2 weeks' :
                       inputs.doubleMonthlyPrincipal ? 'Double principal payments' :
                       'With extra payments'}
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
                          <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Month</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Payment</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Principal</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Interest</th>
                          <th className="text-right p-2 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paydownSchedule.map((payment, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-2 text-gray-900 dark:text-gray-100">{payment.month}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.payment)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.principal)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.interest)}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(payment.balance)}</td>
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
                    💡 <strong>Tip:</strong> Select a paydown strategy in the "Paydown Strategies" tab to see the comparison between schedules.
                  </p>
                </div>
              )}

              {scrollLocked && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    🔒 <strong>Scroll Lock Active:</strong> Both tables will scroll together. Click "Unlock Scrolling" to scroll independently.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Points Calculator Tab */}
          {activeTab === 'points-calculator' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Points Calculator</h2>
                <button
                  onClick={() => {
                    const newId = (scenarios.length + 1).toString();
                    setScenarios([...scenarios, {
                      id: newId,
                      name: `Scenario ${newId}`,
                      rate: 6.0,
                      points: 0,
                      isBaseline: false
                    }]);
                  }}
                  className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Scenario
                </button>
              </div>

              {/* Common Inputs */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Loan Parameters</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Amount</label>
                    <input
                      type="number"
                      value={pointsCalcLoanAmount}
                      onChange={(e) => setPointsCalcLoanAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Default from Calculator tab: {formatCurrency(loanAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Term (years)</label>
                    <select
                      value={pointsCalcTerm}
                      onChange={(e) => setPointsCalcTerm(parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value={15}>15 years</option>
                      <option value={20}>20 years</option>
                      <option value={25}>25 years</option>
                      <option value={30}>30 years</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Default from Calculator tab: {inputs.loanTerm} years
                    </p>
                  </div>
                </div>
              </div>

              {/* Scenario Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario, index) => (
                  <div
                    key={scenario.id}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 ${
                      scenario.isBaseline
                        ? 'border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {scenario.points === 0 ? '0 Points' : `${scenario.points}% Points`}
                      </div>
                      {scenarios.length > 2 && (
                        <button
                          onClick={() => setScenarios(scenarios.filter(s => s.id !== scenario.id))}
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
                          const updated = scenarios.map(s => ({
                            ...s,
                            isBaseline: s.id === scenario.id ? e.target.checked : false
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
                                {Math.round(comparisonResults[index].breakEvenMonths!)} months
                                ({(comparisonResults[index].breakEvenMonths! / 12).toFixed(1)} yrs)
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
                          <div key={result.scenario.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-blue-500 dark:border-blue-400">
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
                          <div key={result.scenario.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{result.scenario.name}</span>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {result.scenario.rate}% • {result.scenario.points}% points • {formatCurrency(result.monthlyPI)}/mo
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-green-700 dark:text-green-400 font-semibold">
                                  Saves {formatCurrency(Math.abs(result.monthlySavings))}/mo
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  +{formatCurrency(result.pointCost - comparisonResults.find(r => r.scenario.isBaseline)!.pointCost)} in points
                                </div>
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  Break-even in {Math.round(result.breakEvenMonths)} months ({(result.breakEvenMonths / 12).toFixed(1)} years)
                                </span>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {result.breakEvenMonths < 60 ? '✓ Good deal if staying 5+ years' :
                                   result.breakEvenMonths < 120 ? '⚠ Only worth it if staying 10+ years' :
                                   '❌ Takes very long to break even'}
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Total Cost Comparison Over Time</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Scenario</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Rate</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Points</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Monthly P&I</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Point Cost</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">5 Years</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">10 Years</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Full Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((result, idx) => {
                        const costAt5 = result.totalCostAt5Years;
                        const costAt10 = result.totalCostAt10Years;
                        const costAtFull = result.totalCostAtFullTerm;

                        const lowestAt5 = Math.min(...comparisonResults.map(r => r.totalCostAt5Years));
                        const lowestAt10 = Math.min(...comparisonResults.map(r => r.totalCostAt10Years));
                        const lowestAtFull = Math.min(...comparisonResults.map(r => r.totalCostAtFullTerm));

                        return (
                          <tr key={result.scenario.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${result.scenario.isBaseline ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{result.scenario.name}</span>
                              {result.scenario.isBaseline && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Baseline</span>
                              )}
                            </td>
                            <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">{result.scenario.rate.toFixed(3)}%</td>
                            <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">{result.scenario.points.toFixed(3)}%</td>
                            <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">{formatCurrency(result.monthlyPI)}</td>
                            <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">{formatCurrency(result.pointCost)}</td>
                            <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${costAt5 === lowestAt5 ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                              {formatCurrency(costAt5)}
                            </td>
                            <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${costAt10 === lowestAt10 ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                              {formatCurrency(costAt10)}
                            </td>
                            <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right ${costAtFull === lowestAtFull ? 'bg-green-100 dark:bg-green-900/30 font-bold text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                              {formatCurrency(costAtFull)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <strong>💡 How to read this table:</strong> Green highlighted cells show the lowest total cost at each time horizon.
                  This helps you choose the best option based on how long you plan to keep the loan.
                </div>
              </div>

              {/* Smart Recommendations */}
              {comparisonResults.length > 0 && (() => {
                const bestAt5 = comparisonResults.reduce((min, r) => r.totalCostAt5Years < min.totalCostAt5Years ? r : min);
                const bestAt10 = comparisonResults.reduce((min, r) => r.totalCostAt10Years < min.totalCostAt10Years ? r : min);
                const bestAtFull = comparisonResults.reduce((min, r) => r.totalCostAtFullTerm < min.totalCostAtFullTerm ? r : min);

                return (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">🎯 Smart Recommendations</h3>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">If you keep the loan for 5 years:</div>
                        <div className="text-green-700 dark:text-green-400">
                          ✓ Choose <strong>{bestAt5.scenario.name}</strong> - Total cost: {formatCurrency(bestAt5.totalCostAt5Years)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">If you keep the loan for 10 years:</div>
                        <div className="text-green-700 dark:text-green-400">
                          ✓ Choose <strong>{bestAt10.scenario.name}</strong> - Total cost: {formatCurrency(bestAt10.totalCostAt10Years)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">If you keep the loan for the full {pointsCalcTerm}-year term:</div>
                        <div className="text-green-700 dark:text-green-400">
                          ✓ Choose <strong>{bestAtFull.scenario.name}</strong> - Total cost: {formatCurrency(bestAtFull.totalCostAtFullTerm)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded">
                      <strong>Note:</strong> Most homeowners refinance or move within 7-10 years. Consider this when weighing upfront costs vs. long-term savings.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Refinance Calculator Tab */}
          {activeTab === 'refinance-calculator' && (
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Balance</label>
                    <input
                      type="number"
                      value={refinanceInputs.currentBalance || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, currentBalance: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Rate (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={refinanceInputs.currentRate || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, currentRate: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Monthly Payment</label>
                    <input
                      type="number"
                      value={refinanceInputs.currentMonthlyPayment || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, currentMonthlyPayment: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remaining Months</label>
                    <input
                      type="number"
                      value={refinanceInputs.remainingMonths || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, remainingMonths: parseFloat(e.target.value) || 0})}
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={refinanceInputs.newRate || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, newRate: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Loan Term (years)</label>
                    <select
                      value={refinanceInputs.newTerm}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, newTerm: parseInt(e.target.value)})}
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
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, closingCosts: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Typical: 2-5% of loan amount
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cash Out ($)</label>
                    <input
                      type="number"
                      value={refinanceInputs.cashOut || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, cashOut: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Optional: Take cash from equity
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points (%)</label>
                    <input
                      type="number"
                      step="0.125"
                      value={refinanceInputs.newPoints || ''}
                      onChange={(e) => setRefinanceInputs({...refinanceInputs, newPoints: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Monthly Payment</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(refinanceResult.newMonthlyPayment)}
                    </div>
                    <div className={`text-sm mt-1 ${refinanceResult.monthlySavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {refinanceResult.monthlySavings > 0 ? '↓' : '↑'} {formatCurrency(Math.abs(refinanceResult.monthlySavings))}/mo
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
                      {refinanceResult.breakEvenMonths !== Infinity ? `${(refinanceResult.breakEvenMonths / 12).toFixed(1)} years` : 'Payment increased'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Savings</div>
                    <div className={`text-2xl font-bold ${refinanceResult.interestSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(refinanceResult.interestSavings)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Over life of loan
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`p-6 rounded-lg border-2 ${
                refinanceResult.breakEvenMonths < 60 && refinanceResult.monthlySavings > 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
                  : refinanceResult.breakEvenMonths < 120 && refinanceResult.monthlySavings > 0
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-400'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
              }`}>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  {refinanceResult.breakEvenMonths < 60 && refinanceResult.monthlySavings > 0 ? '✅ ' :
                   refinanceResult.breakEvenMonths < 120 && refinanceResult.monthlySavings > 0 ? '⚠️ ' : '❌ '}
                  Recommendation
                </h3>
                <p className="text-gray-700 dark:text-gray-200 text-lg">
                  {refinanceResult.recommendation}
                </p>
              </div>

              {/* Detailed Comparison */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Detailed Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Metric</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Current Loan</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">New Loan</th>
                        <th className="text-right p-3 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">Monthly Payment</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceInputs.currentMonthlyPayment)}
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceResult.newMonthlyPayment)}
                        </td>
                        <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                          refinanceResult.monthlySavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {refinanceResult.monthlySavings > 0 ? '-' : '+'}{formatCurrency(Math.abs(refinanceResult.monthlySavings))}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">Interest Rate</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {refinanceInputs.currentRate.toFixed(3)}%
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {refinanceInputs.newRate.toFixed(3)}%
                        </td>
                        <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                          refinanceInputs.newRate < refinanceInputs.currentRate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
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
                        <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                          refinanceInputs.newTerm < (refinanceInputs.remainingMonths / 12) ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {(refinanceInputs.newTerm - (refinanceInputs.remainingMonths / 12)).toFixed(1)} years
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">Total Interest</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceResult.currentTotalInterest)}
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceResult.newTotalInterest)}
                        </td>
                        <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold ${
                          refinanceResult.interestSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {refinanceResult.interestSavings > 0 ? '-' : '+'}{formatCurrency(Math.abs(refinanceResult.interestSavings))}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-blue-50 dark:bg-blue-900/20">
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100">Total Cost (Principal + Interest)</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceResult.currentTotalCost)}
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(refinanceResult.newTotalCost)}
                        </td>
                        <td className={`p-3 border-b border-gray-100 dark:border-gray-700 text-right font-bold ${
                          refinanceResult.netSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {refinanceResult.netSavings > 0 ? '-' : '+'}{formatCurrency(Math.abs(refinanceResult.netSavings))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Comparison Over Time */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Cost Comparison Over Time</h3>
                <div className="grid md:grid-cols-3 gap-4">
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
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Full Term ({refinanceInputs.newTerm} years)</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(refinanceResult.costAtFullTerm)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Total cost including closing
                    </div>
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
                        {refinanceResult.monthlySavings > 0 && ` That's ${formatCurrency(Math.abs(refinanceResult.monthlySavings) * 12)}/year in savings.`}
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
                            <strong>{Math.round(refinanceResult.breakEvenMonths)} months ({(refinanceResult.breakEvenMonths / 12).toFixed(1)} years)</strong>{' '}
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
                            <strong className="text-green-600 dark:text-green-400">{formatCurrency(refinanceResult.netSavings)}</strong>{' '}
                            after accounting for closing costs.
                          </>
                        ) : (
                          <>
                            Over the life of the loan, you'll pay an additional{' '}
                            <strong className="text-red-600 dark:text-red-400">{formatCurrency(Math.abs(refinanceResult.netSavings))}</strong>{' '}
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
                          You're taking out <strong>{formatCurrency(refinanceInputs.cashOut)}</strong> in cash,
                          which will be added to your new loan balance.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;