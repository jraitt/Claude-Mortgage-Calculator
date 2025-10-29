import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'number' | 'date' | 'select';
  value: string | number;
  onChange: (value: string) => void;
  options?: Array<{ value: any; label: string }>;
  helpText?: string;
  step?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  variant?: 'default' | 'light';
  error?: string;
  isValid?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  options,
  helpText,
  step,
  placeholder,
  min,
  max,
  variant = 'default',
  error,
  isValid = true,
}) => {
  // Determine input classes based on validation state
  const getInputClasses = () => {
    const baseClasses = "w-full p-3 border rounded-lg focus:ring-2 transition-colors";
    
    if (error || !isValid) {
      // Error state
      return variant === 'light'
        ? `${baseClasses} border-red-300 bg-red-50 text-red-900 focus:ring-red-400 focus:border-red-400`
        : `${baseClasses} border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400`;
    } else {
      // Normal state
      return variant === 'light'
        ? `${baseClasses} border-gray-200 bg-white text-gray-900 focus:ring-blue-400 focus:border-blue-400`
        : `${baseClasses} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400`;
    }
  };

  const labelClasses = variant === 'light'
    ? "block text-sm font-medium text-gray-100 mb-2"
    : "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  const helpTextClasses = variant === 'light'
    ? "mt-1 text-sm text-gray-200"
    : "mt-1 text-sm text-gray-500 dark:text-gray-400";

  const errorClasses = variant === 'light'
    ? "mt-1 text-sm text-red-200"
    : "mt-1 text-sm text-red-600 dark:text-red-400";

  return (
    <div>
      <label className={labelClasses}>
        {label}
      </label>
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={getInputClasses()}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={getInputClasses()}
          step={step}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )}
      {error && (
        <p className={errorClasses}>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className={helpTextClasses}>
          {helpText}
        </p>
      )}
    </div>
  );
};
