/**
 * Custom hook for managing refinance calculator state and logic
 */

import { useState, useEffect, useMemo } from 'react';
import { RefinanceInputs, RefinanceResult } from '../components/MortgageCalculator';
import { calculateRefinanceAnalysis } from '../utils/calculations/refinanceCalculations';
import { validateRefinanceInputs, ValidationResult } from '../utils/validation';

/**
 * Default refinance inputs
 */
const DEFAULT_REFINANCE_INPUTS: RefinanceInputs = {
  currentBalance: 300000,
  currentRate: 6.5,
  currentMonthlyPayment: 2000,
  newRate: 6.0,
  newTerm: 30,
  closingCosts: 5000,
  cashOut: 0,
  newPoints: 0,
  includeClosingCostsInLoan: false
};

/**
 * Custom hook for refinance calculator
 */
export function useRefinanceCalculator(
  initialBalance?: number,
  initialRate?: number,
  initialPayment?: number
) {
  const [refinanceInputs, setRefinanceInputs] = useState<RefinanceInputs>({
    ...DEFAULT_REFINANCE_INPUTS,
    ...(initialBalance !== undefined && { currentBalance: initialBalance }),
    ...(initialRate !== undefined && { currentRate: initialRate }),
    ...(initialPayment !== undefined && { currentMonthlyPayment: initialPayment })
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate inputs whenever they change
  useEffect(() => {
    const validation = validateRefinanceInputs(refinanceInputs);
    setValidationErrors(validation.errors);
  }, [refinanceInputs]);

  // Calculate refinance result
  const refinanceResult = useMemo(() => {
    return calculateRefinanceAnalysis(refinanceInputs);
  }, [refinanceInputs]);

  /**
   * Update a refinance input field
   */
  const updateInput = (field: keyof RefinanceInputs, value: number) => {
    setRefinanceInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Update current loan details from main calculator
   */
  const syncFromCalculator = (balance: number, rate: number, payment: number) => {
    setRefinanceInputs(prev => ({
      ...prev,
      currentBalance: balance,
      currentRate: rate,
      currentMonthlyPayment: payment
    }));
  };

  /**
   * Reset to default values
   */
  const resetToDefaults = () => {
    setRefinanceInputs(DEFAULT_REFINANCE_INPUTS);
  };

  /**
   * Check if inputs are valid
   */
  const isValid = validationErrors.length === 0;

  return {
    inputs: refinanceInputs,
    result: refinanceResult,
    validationErrors,
    isValid,
    updateInput,
    syncFromCalculator,
    resetToDefaults
  };
}
