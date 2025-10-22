/**
 * Custom hook for managing points calculator state and logic
 */

import { useState, useEffect, useMemo } from 'react';
import { PointsScenario, ComparisonResult } from '../components/MortgageCalculator';
import { calculateComparisonResults } from '../utils/calculations/pointsCalculations';

const SCENARIOS_STORAGE_KEY = 'points-scenarios';

/**
 * Default points scenarios
 */
const DEFAULT_SCENARIOS: PointsScenario[] = [
  { id: '1', name: 'No Points', rate: 6.5, points: 0, isBaseline: true },
  { id: '2', name: '1 Point @ 6.0%', rate: 6.0, points: 1, isBaseline: false },
  { id: '3', name: '2 Points @ 5.75%', rate: 5.75, points: 2, isBaseline: false }
];

/**
 * Load scenarios from localStorage with fallback to defaults
 */
function loadSavedScenarios(): PointsScenario[] {
  try {
    const saved = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure at least one scenario is marked as baseline
      const hasBaseline = parsed.some((s: PointsScenario) => s.isBaseline);
      if (!hasBaseline && parsed.length > 0) {
        parsed[0].isBaseline = true;
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load saved scenarios, using defaults:', error);
  }
  return DEFAULT_SCENARIOS;
}

/**
 * Custom hook for points calculator
 */
export function usePointsCalculator(initialLoanAmount: number, initialTerm: number) {
  const [scenarios, setScenarios] = useState<PointsScenario[]>(loadSavedScenarios);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [term, setTerm] = useState(initialTerm);

  // Save scenarios to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
    } catch (error) {
      console.warn('Failed to save scenarios to localStorage:', error);
    }
  }, [scenarios]);

  // Sync loan amount and term from parent component
  useEffect(() => {
    setLoanAmount(initialLoanAmount);
    setTerm(initialTerm);
  }, [initialLoanAmount, initialTerm]);

  // Calculate comparison results
  const comparisonResults = useMemo(() => {
    return calculateComparisonResults(scenarios, loanAmount, term);
  }, [scenarios, loanAmount, term]);

  /**
   * Add a new scenario
   */
  const addScenario = (name: string, rate: number, points: number) => {
    const newScenario: PointsScenario = {
      id: Date.now().toString(),
      name,
      rate,
      points,
      isBaseline: scenarios.length === 0 // First scenario is baseline
    };
    setScenarios([...scenarios, newScenario]);
  };

  /**
   * Update an existing scenario
   */
  const updateScenario = (id: string, name: string, rate: number, points: number) => {
    setScenarios(scenarios.map(s =>
      s.id === id ? { ...s, name, rate, points } : s
    ));
  };

  /**
   * Delete a scenario
   */
  const deleteScenario = (id: string) => {
    const filtered = scenarios.filter(s => s.id !== id);

    // Ensure remaining scenarios have a baseline
    if (filtered.length > 0 && !filtered.some(s => s.isBaseline)) {
      filtered[0].isBaseline = true;
    }

    setScenarios(filtered);
  };

  /**
   * Set a scenario as baseline
   */
  const setBaseline = (id: string) => {
    setScenarios(scenarios.map(s => ({
      ...s,
      isBaseline: s.id === id
    })));
  };

  /**
   * Reset to default scenarios
   */
  const resetToDefaults = () => {
    setScenarios(DEFAULT_SCENARIOS);
    try {
      localStorage.removeItem(SCENARIOS_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  return {
    scenarios,
    loanAmount,
    term,
    comparisonResults,
    addScenario,
    updateScenario,
    deleteScenario,
    setBaseline,
    resetToDefaults
  };
}
