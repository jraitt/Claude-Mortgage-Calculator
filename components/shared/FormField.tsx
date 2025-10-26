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
}) => {
  const baseInputClasses = variant === 'light'
    ? "w-full p-3 border border-gray-200 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
    : "w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400";

  const labelClasses = variant === 'light'
    ? "block text-sm font-medium text-gray-100 mb-2"
    : "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  const helpTextClasses = variant === 'light'
    ? "mt-1 text-sm text-gray-200"
    : "mt-1 text-sm text-gray-500 dark:text-gray-400";

  return (
    <div>
      <label className={labelClasses}>
        {label}
      </label>
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
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
          className={baseInputClasses}
          step={step}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )}
      {helpText && (
        <p className={helpTextClasses}>
          {helpText}
        </p>
      )}
    </div>
  );
};
