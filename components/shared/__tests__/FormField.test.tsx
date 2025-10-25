import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from '../FormField';

describe('<FormField />', () => {
  it('renders label and input value', () => {
    render(<FormField label="Home Price" type="number" value={400000} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue('400000')).toBeInTheDocument();
  });

  it('invokes onChange handler for text input', () => {
    const handleChange = jest.fn();
    render(<FormField label="Name" value="" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });

    expect(handleChange).toHaveBeenCalledWith('Alice');
  });

  it('renders select options when type is select', () => {
    render(
      <FormField
        label="Term"
        type="select"
        value="30"
        onChange={jest.fn()}
        options={[
          { value: '15', label: '15 years' },
          { value: '30', label: '30 years' },
        ]}
      />
    );

    expect(screen.getByRole('option', { name: '15 years' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '30 years' })).toBeInTheDocument();
  });
});
