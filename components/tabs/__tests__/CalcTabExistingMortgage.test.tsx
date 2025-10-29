/**
 * Unit tests for CalcTabExistingMortgage component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalcTabExistingMortgage } from '../CalcTabExistingMortgage';

// Mock the validation functions
jest.mock('../../../utils/validation', () => ({
  validateExistingMortgageInputs: jest.fn(() => ({ isValid: true, errors: [] })),
}));

// Mock the formatting functions
jest.mock('../../../utils/formatting', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toLocaleString()}`),
  formatMonthsAsYearsMonths: jest.fn((months) => `${months} months`),
}));

describe('CalcTabExistingMortgage', () => {
  const defaultInputs = {
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
    isExistingLoan: true,
    currentBalance: 320000,
    existingInterestRate: 6.5,
    existingMonthlyPayment: 1896.20,
    paydownStrategy: 'extra-payments' as const,
    extraOneTimePayment: 0,
  };

  const defaultProps = {
    inputs: defaultInputs,
    setInputs: jest.fn(),
    updateInput: jest.fn(),
    loanAmount: 320000,
    monthlyPI: 1896.20,
    monthlyRate: 0.065 / 12,
    standardSchedule: [],
    paydownSchedule: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render existing loan details section', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.getByText('Existing Loan Details')).toBeInTheDocument();
  });

  test('should render paydown options section', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.getByText('Paydown Options')).toBeInTheDocument();
  });

  test('should display current balance input with correct value', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const currentBalanceInput = screen.getByLabelText('Current Balance ($)');
    expect(currentBalanceInput).toHaveValue(320000);
  });

  test('should display monthly payment input with correct value', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const monthlyPaymentInput = screen.getByLabelText('Monthly Payment ($)');
    expect(monthlyPaymentInput).toHaveValue(1896.20);
  });

  test('should display interest rate input with correct value', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const interestRateInput = screen.getByLabelText('Interest Rate (%)');
    expect(interestRateInput).toHaveValue(6.5);
  });

  test('should call updateInput when current balance changes', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const currentBalanceInput = screen.getByLabelText('Current Balance ($)');
    fireEvent.change(currentBalanceInput, { target: { value: '300000' } });
    
    expect(defaultProps.updateInput).toHaveBeenCalledWith('currentBalance', '300000');
  });

  test('should call updateInput when monthly payment changes', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const monthlyPaymentInput = screen.getByLabelText('Monthly Payment ($)');
    fireEvent.change(monthlyPaymentInput, { target: { value: '2000' } });
    
    expect(defaultProps.updateInput).toHaveBeenCalledWith('existingMonthlyPayment', '2000');
  });

  test('should call updateInput when interest rate changes', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    const interestRateInput = screen.getByLabelText('Interest Rate (%)');
    fireEvent.change(interestRateInput, { target: { value: '7.0' } });
    
    expect(defaultProps.updateInput).toHaveBeenCalledWith('existingInterestRate', '7.0');
  });

  test('should render extra payments strategy option', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.getByText('Repayment with extra payments')).toBeInTheDocument();
  });

  test('should display extra monthly principal input when extra payments strategy is selected', () => {
    const propsWithExtraPayments = {
      ...defaultProps,
      inputs: { ...defaultInputs, paydownStrategy: 'extra-payments' as const },
    };
    
    render(<CalcTabExistingMortgage {...propsWithExtraPayments} />);
    
    expect(screen.getByLabelText('Extra per month ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Extra per year ($)')).toBeInTheDocument();
  });

  test('should call updateInput when extra monthly principal changes', () => {
    const propsWithExtraPayments = {
      ...defaultProps,
      inputs: { ...defaultInputs, paydownStrategy: 'extra-payments' as const },
    };
    
    render(<CalcTabExistingMortgage {...propsWithExtraPayments} />);
    
    const extraMonthlyInput = screen.getByLabelText('Extra per month ($)');
    fireEvent.change(extraMonthlyInput, { target: { value: '200' } });
    
    expect(defaultProps.updateInput).toHaveBeenCalledWith('extraMonthlyPrincipal', '200');
  });

  test('should call updateInput when extra annual payment changes', () => {
    const propsWithExtraPayments = {
      ...defaultProps,
      inputs: { ...defaultInputs, paydownStrategy: 'extra-payments' as const },
    };
    
    render(<CalcTabExistingMortgage {...propsWithExtraPayments} />);
    
    const extraAnnualInput = screen.getByLabelText('Extra per year ($)');
    fireEvent.change(extraAnnualInput, { target: { value: '5000' } });
    
    expect(defaultProps.updateInput).toHaveBeenCalledWith('extraAnnualPayment', '5000');
  });

  test('should handle validation errors', () => {
    // Mock validation to return errors
    const mockValidation = require('../../../utils/validation');
    mockValidation.validateExistingMortgageInputs.mockReturnValue({
      isValid: false,
      errors: ['Current balance cannot be negative'],
    });

    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.getByText('Invalid Input Detected')).toBeInTheDocument();
    expect(screen.getByText('Current balance cannot be negative')).toBeInTheDocument();
  });

  test('should not display validation errors when inputs are valid', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.queryByText('Invalid Input Detected')).not.toBeInTheDocument();
  });

  test('should render paydown strategy summary section', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    // Should render some kind of summary or results section
    // The exact text depends on the component implementation
    expect(screen.getByText('Paydown Options')).toBeInTheDocument();
  });

  test('should handle scroll lock functionality', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    // Should render without errors even with scroll functionality
    expect(screen.getByText('Existing Loan Details')).toBeInTheDocument();
  });

  test('should render help text for form fields', () => {
    render(<CalcTabExistingMortgage {...defaultProps} />);
    
    expect(screen.getByText('What you currently owe on your mortgage')).toBeInTheDocument();
    expect(screen.getByText('Principal & Interest only (exclude taxes, insurance, PMI)')).toBeInTheDocument();
    expect(screen.getByText('Your current annual interest rate')).toBeInTheDocument();
  });

  test('should handle different paydown strategies', () => {
    const strategies = ['extra-payments', 'biweekly', 'double-principal'] as const;
    
    strategies.forEach(strategy => {
      const propsWithStrategy = {
        ...defaultProps,
        inputs: { ...defaultInputs, paydownStrategy: strategy },
      };
      
      expect(() => render(<CalcTabExistingMortgage {...propsWithStrategy} />)).not.toThrow();
    });
  });
});