/**
 * Unit tests for CalcTabPoints component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalcTabPoints } from '../CalcTabPoints';

// Mock the validation functions
jest.mock('../../../utils/validation', () => ({
  validatePointsInputs: jest.fn(() => ({ isValid: true, errors: [] })),
  validatePointsScenario: jest.fn(() => ({ isValid: true, errors: [] })),
}));

// Mock the formatting functions
jest.mock('../../../utils/formatting', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toLocaleString()}`),
}));

describe('CalcTabPoints', () => {
  const defaultProps = {
    scenarios: [
      {
        id: '1',
        name: 'Baseline',
        rate: 7.0,
        points: 0,
        isBaseline: true,
      },
      {
        id: '2',
        name: 'With Points',
        rate: 6.5,
        points: 1.5,
        isBaseline: false,
      },
    ],
    setScenarios: jest.fn(),
    pointsCalcLoanAmount: 320000,
    setPointsCalcLoanAmount: jest.fn(),
    pointsCalcTerm: 30,
    setPointsCalcTerm: jest.fn(),
    loanAmount: 320000,
    loanTerm: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render points calculator header', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    expect(screen.getByText('Points Calculator')).toBeInTheDocument();
    expect(screen.getByText('+ Add Scenario')).toBeInTheDocument();
  });

  test('should render loan parameters section', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    expect(screen.getByText('Loan Parameters')).toBeInTheDocument();
    expect(screen.getByLabelText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Loan Term (years)')).toBeInTheDocument();
  });

  test('should display loan amount input with correct value', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanAmountInput = screen.getByLabelText('Loan Amount');
    expect(loanAmountInput).toHaveValue(320000);
  });

  test('should display loan term select with correct value', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanTermSelect = screen.getByLabelText('Loan Term (years)');
    expect(loanTermSelect).toHaveValue('30');
  });

  test('should call setPointsCalcLoanAmount when loan amount changes', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanAmountInput = screen.getByLabelText('Loan Amount');
    fireEvent.change(loanAmountInput, { target: { value: '350000' } });
    
    expect(defaultProps.setPointsCalcLoanAmount).toHaveBeenCalledWith(350000);
  });

  test('should call setPointsCalcTerm when loan term changes', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanTermSelect = screen.getByLabelText('Loan Term (years)');
    fireEvent.change(loanTermSelect, { target: { value: '15' } });
    
    expect(defaultProps.setPointsCalcTerm).toHaveBeenCalledWith(15);
  });

  test('should call setScenarios when add scenario button is clicked', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const addButton = screen.getByText('+ Add Scenario');
    fireEvent.click(addButton);
    
    expect(defaultProps.setScenarios).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...defaultProps.scenarios,
        expect.objectContaining({
          id: '3',
          name: 'Scenario 3',
          rate: 6.0,
          points: 0,
          isBaseline: false,
        }),
      ])
    );
  });

  test('should render scenarios when provided', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    // Should render scenario names or related content
    // Use getAllByText since "Baseline" appears multiple times (in scenario name and badge)
    const baselineElements = screen.getAllByText('Baseline');
    expect(baselineElements.length).toBeGreaterThan(0);
  });

  test('should display help text for loan amount', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    // Use getAllByText since "Default from Calculator tab" appears multiple times
    const helpTexts = screen.getAllByText(/Default from Calculator tab/);
    expect(helpTexts.length).toBeGreaterThan(0);
  });

  test('should handle empty scenarios array', () => {
    const emptyProps = { ...defaultProps, scenarios: [] };
    
    expect(() => render(<CalcTabPoints {...emptyProps} />)).not.toThrow();
  });

  test('should handle validation errors', () => {
    // Mock validation to return errors
    const mockValidation = require('../../../utils/validation');
    mockValidation.validatePointsInputs.mockReturnValue({
      isValid: false,
      errors: ['Loan amount is too small'],
    });

    render(<CalcTabPoints {...defaultProps} />);
    
    expect(screen.getByText('Invalid Input Detected')).toBeInTheDocument();
    // Use getAllByText since error message appears in both the error banner and field error
    const errorMessages = screen.getAllByText('Loan amount is too small');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  test('should not display validation errors when inputs are valid', () => {
    // Ensure validation returns valid state
    const mockValidation = require('../../../utils/validation');
    mockValidation.validatePointsInputs.mockReturnValue({
      isValid: true,
      errors: [],
    });

    render(<CalcTabPoints {...defaultProps} />);
    
    expect(screen.queryByText('Invalid Input Detected')).not.toBeInTheDocument();
  });

  test('should handle loan amount input with invalid values', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanAmountInput = screen.getByLabelText('Loan Amount');
    fireEvent.change(loanAmountInput, { target: { value: 'invalid' } });
    
    // Should call with 0 for invalid input
    expect(defaultProps.setPointsCalcLoanAmount).toHaveBeenCalledWith(0);
  });

  test('should render with different loan term options', () => {
    render(<CalcTabPoints {...defaultProps} />);
    
    const loanTermSelect = screen.getByLabelText('Loan Term (years)');
    const options = Array.from(loanTermSelect.querySelectorAll('option'));
    
    expect(options).toHaveLength(4);
    expect(options.map(opt => opt.textContent)).toEqual([
      '15 years',
      '20 years', 
      '25 years',
      '30 years'
    ]);
  });
});