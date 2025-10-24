import React from 'react';

type ColorVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';

interface Metric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface SummaryCardProps {
  title: string;
  color?: ColorVariant;
  metrics: Metric[];
  className?: string;
  icon?: React.ReactNode;
}

const colorClasses: Record<ColorVariant, { bg: string; border: string; title: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    title: 'text-blue-800 dark:text-blue-200'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    title: 'text-green-800 dark:text-green-200'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    title: 'text-red-800 dark:text-red-200'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    title: 'text-yellow-800 dark:text-yellow-200'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    title: 'text-purple-800 dark:text-purple-200'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    title: 'text-gray-800 dark:text-gray-200'
  }
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  color = 'gray',
  metrics,
  className = '',
  icon
}) => {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} p-4 rounded-lg border ${colors.border} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className={`font-semibold ${colors.title}`}>{title}</h3>
      </div>
      <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{metric.label}:</span>
            <span className={metric.highlight ? 'font-semibold' : ''}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
