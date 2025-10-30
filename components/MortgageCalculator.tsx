'use client'

import React, { useState, useEffect } from 'react';
import { Calculator, Home, TrendingDown, Scale, RefreshCw, Download, Sun, Moon } from 'lucide-react';
import { generateMortgageCSV, downloadCSV, generateFilename, generateNewMortgageCSV, generatePointsCSV, generateRefinanceCSV } from '../utils/csvExport';
import { useTheme } from '../contexts/ThemeContext';
import { validateRefinanceInputs } from '../utils/validation';
import { calculateRefinanceAnalysis } from '../utils/calculations/refinanceCalculations';
import { useBasicMetrics, useAmortizationSchedules, usePointsComparison } from '../utils/hooks/useCalculations';
import {
  CalcTabNewMortgage,
  CalcTabExistingMortgage,
  CalcTabPoints,
  CalcTabRefinance,
} from './tabs';

// Define the type for mortgage calculator inputs
export type PaydownStrategy = 'extra-payments' | 'biweekly' | 'double-principal';

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
  currentBalance: number;
  existingInterestRate: number;
  existingMonthlyPayment: number;
  paydownStrategy: PaydownStrategy;
  extraOneTimePayment: number;
};

// Points calculator types
export type PointsScenario = {
  id: string;
  name: string;
  rate: number;
  points: number;
  isBaseline: boolean;
};

export type ComparisonResult = {
  scenario: PointsScenario;
  monthlyPI: number;
  pointCost: number;
  totalInterest: number;
  totalCost: number;
  breakEvenMonths: number | null;
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
  newRate: number;
  newTerm: number;
  closingCosts: number;
  cashOut: number;
  newPoints: number;
  includeClosingCostsInLoan: boolean;
};

export type RefinanceResult = {
  newLoanAmount: number;
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
  recommendationType: 'excellent' | 'good' | 'marginal' | 'not-recommended';
  analysisType: 'break-even' | 'time-savings';
  remainingMonths: number;
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
    isExistingLoan: false,
    currentBalance: 300000,
    existingInterestRate: 6.5,
    existingMonthlyPayment: 2000,
    paydownStrategy: 'extra-payments',
    extraOneTimePayment: 0,
  };

  // Load saved inputs from localStorage or use defaults
  const loadSavedInputs = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mortgageCalculatorInputs');
        if (saved) {
          const parsedInputs = JSON.parse(saved);
          return { ...defaultInputs, ...parsedInputs };
        }
      } catch (error) {
        console.warn('Failed to load saved mortgage calculator inputs:', error);
      }
    }
    return defaultInputs;
  };

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
    return [
      { id: '1', name: '0 Points', rate: 5.625, points: 0, isBaseline: true },
      { id: '2', name: '1.0 Points', rate: 5.375, points: 1.0, isBaseline: false },
      { id: '3', name: '1.625 Points', rate: 5.25, points: 1.625, isBaseline: false },
    ];
  };

  // Load saved refinance inputs from localStorage or use defaults
  const loadSavedRefinanceInputs = (): RefinanceInputs => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('refinanceCalculatorInputs');
        if (saved) {
          const parsedInputs = JSON.parse(saved);
          return { 
            currentBalance: 300000,
            currentRate: 6.5,
            currentMonthlyPayment: 2000,
            newRate: 5.5,
            newTerm: 30,
            closingCosts: 3000,
            cashOut: 0,
            newPoints: 0,
            includeClosingCostsInLoan: false,
            ...parsedInputs 
          };
        }
      } catch (error) {
        console.warn('Failed to load saved refinance calculator inputs:', error);
      }
    }
    return {
      currentBalance: 300000,
      currentRate: 6.5,
      currentMonthlyPayment: 2000,
      newRate: 5.5,
      newTerm: 30,
      closingCosts: 3000,
      cashOut: 0,
      newPoints: 0,
      includeClosingCostsInLoan: false,
    };
  };

  // State
  const [inputs, setInputs] = useState<MortgageInputs>(loadSavedInputs);
  const [activeTab, setActiveTab] = useState('calculator');
  const [scenarios, setScenarios] = useState<PointsScenario[]>(loadSavedScenarios);
  const [pointsCalcLoanAmount, setPointsCalcLoanAmount] = useState<number>(320000);
  const [pointsCalcTerm, setPointsCalcTerm] = useState<number>(30);
  const [refinanceInputs, setRefinanceInputs] = useState<RefinanceInputs>(loadSavedRefinanceInputs);
  const [refinanceValidationErrors, setRefinanceValidationErrors] = useState<string[]>([]);

  // Automatically set isExistingLoan based on active tab
  // This ensures calculations use the correct mode for each tab
  const effectiveInputs = {
    ...inputs,
    isExistingLoan: activeTab === 'strategies' || activeTab === 'refinance-calculator'
  };

  // Use custom hooks for calculations
  const { loanAmount, monthlyRate, totalPayments, monthlyPI, ltvRatio, monthlyPMI, monthlyEscrow, totalMonthlyPayment } =
    useBasicMetrics(effectiveInputs);

  const { standardSchedule, paydownSchedule } = useAmortizationSchedules(effectiveInputs);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mortgageCalculatorInputs', JSON.stringify(inputs));
      } catch (error) {
        console.warn('Failed to save mortgage calculator inputs:', error);
      }
    }
  }, [inputs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pointsCalculatorScenarios', JSON.stringify(scenarios));
      } catch (error) {
        console.warn('Failed to save points calculator scenarios:', error);
      }
    }
  }, [scenarios]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('refinanceCalculatorInputs', JSON.stringify(refinanceInputs));
      } catch (error) {
        console.warn('Failed to save refinance calculator inputs:', error);
      }
    }
  }, [refinanceInputs]);

  // Sync points calculator when switching tabs
  useEffect(() => {
    if (activeTab === 'points-calculator') {
      setPointsCalcLoanAmount(loanAmount);
      setPointsCalcTerm(inputs.loanTerm);
    }
  }, [activeTab, loanAmount, inputs.loanTerm]);



  // Validate refinance inputs
  useEffect(() => {
    const validation = validateRefinanceInputs(refinanceInputs);
    setRefinanceValidationErrors(validation.errors);
  }, [refinanceInputs]);

  // Reset to defaults
  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all fields to their default values? This will clear your saved data.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mortgageCalculatorInputs');
        localStorage.removeItem('pointsCalculatorScenarios');
        localStorage.removeItem('refinanceCalculatorInputs');
      }
      setInputs(defaultInputs);
      setScenarios(loadSavedScenarios());
      setRefinanceInputs(loadSavedRefinanceInputs());
      setPointsCalcLoanAmount(320000);
      setPointsCalcTerm(30);
    }
  };

  // Download CSV report for current active tab
  const handleDownloadCSV = () => {
    try {
      let csvContent = '';
      
      switch (activeTab) {
        case 'calculator':
          // New Mortgage tab
          csvContent = generateNewMortgageCSV(
            inputs,
            loanAmount,
            monthlyPI,
            monthlyPMI,
            monthlyEscrow,
            totalMonthlyPayment,
            standardSchedule
          );
          break;
          
        case 'strategies':
          // Existing Mortgage tab - use original function
          const hasPaydownStrategy =
            inputs.biWeeklyPayments ||
            inputs.doubleMonthlyPrincipal ||
            inputs.extraMonthlyPrincipal > 0 ||
            inputs.extraAnnualPayment > 0;

          csvContent = generateMortgageCSV(
            inputs,
            loanAmount,
            monthlyPI,
            monthlyPMI,
            monthlyEscrow,
            totalMonthlyPayment,
            standardSchedule,
            hasPaydownStrategy ? paydownSchedule : []
          );
          break;
          
        case 'points-calculator':
          // Points Calculator tab
          const comparisonResults = usePointsComparison(scenarios, pointsCalcLoanAmount, pointsCalcTerm);
          csvContent = generatePointsCSV(
            scenarios,
            comparisonResults,
            pointsCalcLoanAmount,
            pointsCalcTerm
          );
          break;
          
        case 'refinance-calculator':
          // Refinance Calculator tab
          const refinanceResult = calculateRefinanceAnalysis(refinanceInputs);
          csvContent = generateRefinanceCSV(refinanceInputs, refinanceResult);
          break;
          
        default:
          throw new Error('Unknown tab type');
      }

      const filename = generateFilename(activeTab);
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Failed to generate CSV:', error);
      alert('Failed to generate CSV report. Please try again.');
    }
  };

  const updateInput = (field: string, value: string) => {
    setInputs((prev: MortgageInputs) => ({
      ...prev,
      [field]: value === '' ? 0 : parseFloat(value) || 0,
    }));
  };

  const TabButton = ({
    id,
    label,
    icon: Icon,
    isActive,
    onClick,
  }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm rounded-t-lg border-t-2 border-l-2 border-r-2 transition-all relative whitespace-nowrap ${
        isActive
          ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-400 shadow-sm z-10 -mb-px'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-400'
      }`}
    >
      <Icon size={14} className="sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">
        {id === 'calculator' && 'New'}
        {id === 'strategies' && 'Existing'}
        {id === 'points-calculator' && 'Points'}
        {id === 'refinance-calculator' && 'Refinance'}
      </span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Home size={24} className="sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mortgage Tools Pro</h1>
                <p className="text-blue-100 dark:text-blue-200 mt-1 text-sm sm:text-base">Industry leading tools to help you with all your mortgage needs</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="bg-blue-500 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="bg-green-600 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2"
                title="Download current tab data as CSV"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download .csv</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-4">
          <div className="flex overflow-x-auto space-x-1 -mb-px scrollbar-hide">
            <TabButton id="calculator" label="New Mortgage" icon={Calculator} isActive={activeTab === 'calculator'} onClick={setActiveTab} />
            <TabButton id="strategies" label="Existing Mortgage" icon={TrendingDown} isActive={activeTab === 'strategies'} onClick={setActiveTab} />
            <TabButton id="points-calculator" label="Points Calculator" icon={Scale} isActive={activeTab === 'points-calculator'} onClick={setActiveTab} />
            <TabButton id="refinance-calculator" label="Refinance Calculator" icon={RefreshCw} isActive={activeTab === 'refinance-calculator'} onClick={setActiveTab} />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* New Mortgage Tab */}
          {activeTab === 'calculator' && (
            <CalcTabNewMortgage
              inputs={inputs}
              loanAmount={loanAmount}
              monthlyPI={monthlyPI}
              monthlyPMI={monthlyPMI}
              monthlyEscrow={monthlyEscrow}
              totalMonthlyPayment={totalMonthlyPayment}
              ltvRatio={ltvRatio}
              totalPayments={totalPayments}
              standardSchedule={standardSchedule}
              updateInput={updateInput}
            />
          )}

          {/* Existing Mortgage Tab */}
          {activeTab === 'strategies' && (
            <CalcTabExistingMortgage
              inputs={inputs}
              setInputs={setInputs}
              updateInput={updateInput}
              loanAmount={loanAmount}
              monthlyPI={monthlyPI}
              monthlyRate={monthlyRate}
              standardSchedule={standardSchedule}
              paydownSchedule={paydownSchedule}
            />
          )}

          {/* Points Calculator Tab */}
          {activeTab === 'points-calculator' && (
            <CalcTabPoints
              scenarios={scenarios}
              setScenarios={setScenarios}
              pointsCalcLoanAmount={pointsCalcLoanAmount}
              setPointsCalcLoanAmount={setPointsCalcLoanAmount}
              pointsCalcTerm={pointsCalcTerm}
              setPointsCalcTerm={setPointsCalcTerm}
              loanAmount={loanAmount}
              loanTerm={inputs.loanTerm}
            />
          )}

          {/* Refinance Calculator Tab */}
          {activeTab === 'refinance-calculator' && (
            <CalcTabRefinance
              refinanceInputs={refinanceInputs}
              setRefinanceInputs={setRefinanceInputs}
              refinanceValidationErrors={refinanceValidationErrors}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
