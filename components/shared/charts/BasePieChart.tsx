'use client'

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { getChartColors, getColorPalette } from './ChartContainer';
import { formatCurrency, formatPercentage } from '@/utils/formatting';

export interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface BasePieChartProps {
  data: PieDataPoint[];
  showLegend?: boolean;
  innerRadius?: number; // 0 for pie, >0 for donut
  outerRadius?: number;
  formatTooltip?: (value: number) => string;
  showPercentage?: boolean;
  height?: number;
}

/**
 * BasePieChart - Reusable pie/donut chart component with dark mode support
 * Supports both pie and donut styles, custom colors, and percentages
 */
export const BasePieChart: React.FC<BasePieChartProps> = ({
  data,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatTooltip = (value) => formatCurrency(value),
  showPercentage = true,
  height = 300,
}) => {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const palette = getColorPalette(theme);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const percentage = (data.value / total) * 100;

    return (
      <div
        className="rounded-lg border p-3 shadow-lg"
        style={{
          backgroundColor: colors.tooltip,
          borderColor: colors.tooltipBorder,
        }}
      >
        <p
          className="font-semibold mb-1"
          style={{ color: colors.text }}
        >
          {data.name}
        </p>
        <p
          className="text-sm"
          style={{ color: data.payload.fill }}
        >
          {formatTooltip(data.value)}
        </p>
        {showPercentage && (
          <p
            className="text-sm"
            style={{ color: colors.text }}
          >
            {formatPercentage(percentage / 100)}
          </p>
        )}
      </div>
    );
  };

  const renderCustomLabel = (entry: any) => {
    const percentage = (entry.value / total) * 100;
    if (percentage < 5) return ''; // Don't show label for small slices
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          label={showPercentage ? renderCustomLabel : false}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || palette[index % palette.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '12px', color: colors.text }}
            iconType="circle"
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};
