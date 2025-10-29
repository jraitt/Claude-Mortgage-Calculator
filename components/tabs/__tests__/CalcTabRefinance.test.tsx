/**
 * Unit tests for CalcTabRefinance component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalcTabRefinance } from '../CalcTabRefinance';

// Mock the refinance calculations
jest.mock('../../../utils/calculations/refinanceCalculations', () => ({
  calculateRefinanceAnalysis: jest.fn(() => ({
    newMonthlyPayment: 1703.25,
    monthlySavings: 192.95,
    totalClosingCosts: 3000,
    breakEvenMonths: 15.5,
    currentTotalInterest: 382633,
    newTotalInterest: 313170,
    interestSavings: 69463,
    currentTotalCost: 682633,
    newTotalCost: 616170,
    netSavings: 66463,
    costAt5Years: 105195,
    costAt10Years: 207390,
    costAtFullTerm: 616170,
    recommendation: 'Excellent refinancing opportunity! Break-even in 16 months.',
  })),
}));

// Mock the formatting functions
jest.mock('../../../utils/formatting', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toLocaleString()}`),
  formatMonthsAsYearsMonths: jest.fn((months) => `${Math.floor(months)} months`),
}));

describe('CalcTabRefinance', () => {
  const defaultRefinanceInputs = {
    currentBalance: 300000,
    currentRate: 7.0,
    currentMonthlyPayment: 1996.20,
    remainingMonths: 300,
    newRate: 6.0,
    newTerm: 30,
    closingCosts: 3000,
    cashOut: 0,
    newPoints: 0,
  };

  const defaultProps = {
    refinanceInputs: defaultRefinanceInputs,
    setRefinanceInputs: jest.fn(),
    refinanceValidationErrors: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render refinance calculator header', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    expect(screen.getByText('Refinance Calculator')).toBeInTheDocument();
  });

  test('should render current loan details section', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    expect(screen.getByText('Current Loan Details')).toBeInTheDocument();
  });

  test('should display current balance input with correct value', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const currentBalanceInput = screen.getByLabelText('Current Balance');
    expect(currentBalanceInput).toHaveValue(300000);
  });

  test('should display current rate input with correct value', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const currentRateInput = screen.getByLabelText('Current Rate (%)');
    expect(currentRateInput).toHaveValue(7.0);
  });

  test('should display current monthly payment input with correct value', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const currentPaymentInput = screen.getByLabelText('Current Monthly Payment');
    expect(currentPaymentInput).toHaveValue(1996.20);
  });

  test('should call setRefinanceInputs when current balance changes', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const currentBalanceInput = screen.getByLabelText('Current Balance');
    fireEvent.change(currentBalanceInput, { target: { value: '320000' } });
    
    expect(defaultProps.setRefinanceInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  test('should call setRefinanceInputs when new rate changes', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const newRateInput = screen.getByLabelText('New Rate (%)');
    fireEvent.change(newRateInput, { target: { value: '5.5' } });
    
    expect(defaultProps.setRefinanceInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  test('should display validation errors when provided', () => {
    const propsWithErrors = {
      ...defaultProps,
      refinanceValidationErrors: ['Current balance is too low', 'Interest rate is invalid'],
    };
    
    render(<CalcTabRefinance {...propsWithErrors} />);
    
    expect(screen.getByText('Invalid Input Detected')).toBeInTheDocument();
    expect(screen.getByText('Current balance is too low')).toBeInTheDocument();
    expect(screen.getByText('Interest rate is invalid')).toBeInTheDocument();
  });

  test('should not display validation errors when none provided', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    expect(screen.queryByText('Invalid Input Detected')).not.toBeInTheDocument();
  });

  test('should render new loan details section', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    expect(screen.getByText('New Loan Details')).toBeInTheDocument();
  });

  test('should display new rate input', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const newRateInput = screen.getByLabelText('New Rate (%)');
    expect(newRateInput).toHaveValue(6.0);
  });

  test('should display new term select', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const newTermSelect = screen.getByLabelText('New Term (years)');
    expect(newTermSelect).toHaveValue('30');
  });

  test('should display closing costs input', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const closingCostsInput = screen.getByLabelText('Closing Costs');
    expect(closingCostsInput).toHaveValue(3000);
  });

  test('should display cash out input', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const cashOutInput = screen.getByLabelText('Cash Out');
    expect(cashOutInput).toHaveValue(0);
  });

  test('should display points input', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const pointsInput = screen.getByLabelText('Points');
    expect(pointsInput).toHaveValue(0);
  });

  test('should render refinance analysis section', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    // Should display analysis results
    expect(screen.getByText(/Break-even/)).toBeInTheDocument();
  });

  test('should display monthly payment comparison', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    // Should show current vs new payment comparison
    expect(screen.getByText(/Monthly Payment/)).toBeInTheDocument();
  });

  test('should display break-even analysis', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    // Should show break-even information
    expect(screen.getByText(/Break-even/)).toBeInTheDocument();
  });

  test('should display cost comparison at different time horizons', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    // Should show cost comparison over time
    expect(screen.getByText(/Cost Comparison/)).toBeInTheDocument();
  });

  test('should display recommendation', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    // Should show refinancing recommendation
    expect(screen.getByText(/Recommendation/)).toBeInTheDocument();
  });

  test('should handle remaining months input', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const remainingMonthsInput = screen.getByLabelText('Remaining Months');
    expect(remainingMonthsInput).toHaveValue(300);
  });

  test('should update refinance inputs when form values change', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const closingCostsInput = screen.getByLabelText('Closing Costs');
    fireEvent.change(closingCostsInput, { target: { value: '4000' } });
    
    expect(defaultProps.setRefinanceInputs).toHaveBeenCalled();
  });

  test('should handle cash-out refinancing inputs', () => {
    const cashOutProps = {
      ...defaultProps,
      refinanceInputs: { ...defaultRefinanceInputs, cashOut: 25000 },
    };
    
    render(<CalcTabRefinance {...cashOutProps} />);
    
    const cashOutInput = screen.getByLabelText('Cash Out');
    expect(cashOutInput).toHaveValue(25000);
  });

  test('should handle points in new loan', () => {
    const pointsProps = {
      ...defaultProps,
      refinanceInputs: { ...defaultRefinanceInputs, newPoints: 1.5 },
    };
    
    render(<CalcTabRefinance {...pointsProps} />);
    
    const pointsInput = screen.getByLabelText('Points');
    expect(pointsInput).toHaveValue(1.5);
  });

  test('should render term options correctly', () => {
    render(<CalcTabRefinance {...defaultProps} />);
    
    const termSelect = screen.getByLabelText('New Term (years)');
    const options = Array.from(termSelect.querySelectorAll('option'));
    
    expect(options.length).toBeGreaterThan(0);
    expect(options.some(opt => opt.textContent === '15 years')).toBe(true);
    expect(options.some(opt => opt.textContent === '30 years')).toBe(true);
  });
});