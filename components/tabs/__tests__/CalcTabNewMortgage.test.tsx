import { render, screen } from '@testing-library/react';
import { CalcTabNewMortgage } from '../CalcTabNewMortgage';
import type { MortgageInputs } from '../../MortgageCalculator';

const inputs: MortgageInputs = {
  homePrice: 400000,
  downPayment: 80000,
  loanTerm: 30,
  interestRate: 6.5,
  propertyTax: 6000,
  homeInsurance: 1200,
  pmiRate: 0.5,
  pmiAmount: 0,
  extraMonthlyPrincipal: 0,
  doubleMonthlyPrincipal: false,
  extraAnnualPayment: 0,
  biWeeklyPayments: false,
  isExistingLoan: false,
  currentBalance: 320000,
  existingInterestRate: 6.5,
  existingMonthlyPayment: 1896.20,
  paydownStrategy: 'extra-payments' as const,
  extraOneTimePayment: 0,
};

const schedule = [
  {
    month: 1,
    payment: 2000,
    principal: 800,
    interest: 1200,
    extraPrincipal: 0,
    balance: 319200,
    totalInterest: 1200,
    pmi: 150,
    escrow: 600,
  },
];

describe('<CalcTabNewMortgage />', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders loan detail inputs and summary cards', () => {
    render(
      <CalcTabNewMortgage
        inputs={inputs}
        loanAmount={320000}
        monthlyPI={2000}
        monthlyPMI={150}
        monthlyEscrow={600}
        totalMonthlyPayment={2750}
        ltvRatio={85}
        totalPayments={360}
        standardSchedule={schedule}
        updateInput={jest.fn()}
      />
    );

    expect(screen.getByText('Loan Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('400000')).toBeInTheDocument();
    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Monthly Payment')).toBeInTheDocument();
  });
});
