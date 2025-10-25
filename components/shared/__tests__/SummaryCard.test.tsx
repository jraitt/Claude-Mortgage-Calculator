import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';

describe('<SummaryCard />', () => {
  it('renders title and metrics', () => {
    render(
      <SummaryCard
        title="Monthly Payment"
        color="green"
        metrics={[
          { label: 'Principal & Interest', value: '$2,000' },
          { label: 'Taxes', value: '$400', highlight: true },
        ]}
      />
    );

    expect(screen.getByText('Monthly Payment')).toBeInTheDocument();
    expect(screen.getByText('Principal & Interest:')).toBeInTheDocument();
    expect(screen.getByText('$2,000')).toBeInTheDocument();
    expect(screen.getByText('$400')).toHaveClass('font-semibold');
  });

  it('supports optional icon and custom className', () => {
    render(
      <SummaryCard
        title="Loan Amount"
        metrics={[{ label: 'Amount', value: '$320,000' }]}
        className="shadow"
        icon={<span data-testid="icon">*</span>}
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
  });
});
