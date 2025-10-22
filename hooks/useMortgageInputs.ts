/**
 * Custom hook for managing mortgage calculator inputs
 * Handles state, localStorage persistence, and input updates
 */

import { useState, useEffect } from 'react';
import { MortgageInputs } from '../components/MortgageCalculator';

const STORAGE_KEY = 'mortgage-inputs';

/**
 * Default mortgage inputs
 */
const DEFAULT_INPUTS: MortgageInputs = {
  homePrice: 400000,
  downPayment: 80000,
  loanTerm: 30,
  interestRate: 6.5,
  propertyTax: 3600,
  homeInsurance: 1200,
  pmiRate: 0.5,
  pmiAmount: 0,
  extraMonthlyPrincipal: 0,
  doubleMonthlyPrincipal: false,
  extraAnnualPayment: 0,
  biWeeklyPayments: false,
  isExistingLoan: false,
  loanStartDate: '',
  originalPrincipal: 0,
  currentBalance: 0,
  paymentsMade: 0
};

/**
 * Load mortgage inputs from localStorage with fallback to defaults
 */
function loadSavedInputs(): MortgageInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_INPUTS;
  } catch (error) {
    console.warn('Failed to load saved inputs, using defaults:', error);
    return DEFAULT_INPUTS;
  }
}

/**
 * Custom hook for mortgage inputs
 */
export function useMortgageInputs() {
  const [inputs, setInputs] = useState<MortgageInputs>(loadSavedInputs);

  // Save inputs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch (error) {
      console.warn('Failed to save inputs to localStorage:', error);
    }
  }, [inputs]);

  /**
   * Update a single input field
   */
  const updateInput = (field: keyof MortgageInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Reset inputs to default values
   */
  const resetToDefaults = () => {
    setInputs(DEFAULT_INPUTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  return {
    inputs,
    setInputs,
    updateInput,
    resetToDefaults,
    defaultInputs: DEFAULT_INPUTS
  };
}
