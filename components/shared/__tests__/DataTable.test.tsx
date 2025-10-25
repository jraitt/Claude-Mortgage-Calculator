import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

const headers = ['Month', 'Payment'];
const rows = [
  { month: 1, payment: '$2,000' },
  { month: 2, payment: '$2,010' },
];

describe('<DataTable />', () => {
  it('renders provided headers and rows', () => {
    render(<DataTable headers={headers} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1); // header + rows
    expect(screen.getByText('$2,000')).toBeInTheDocument();
  });

  it('applies custom className callbacks', () => {
    const rowClassName = jest.fn().mockReturnValue('bg-gray-50');
    const cellClassName = jest.fn().mockReturnValue('text-right');

    render(
      <DataTable
        headers={headers}
        rows={rows}
        rowClassName={rowClassName}
        cellClassName={cellClassName}
        stickyHeader={false}
      />
    );

    expect(rowClassName).toHaveBeenCalledTimes(rows.length);
    expect(cellClassName).toHaveBeenCalled();
  });
});
