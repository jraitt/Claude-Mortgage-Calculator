'use client'

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { getChartColors, getColorPalette } from './ChartContainer';
import { formatCurrency } from '@/utils/formatting';

export interface BarDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface BarConfig {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
}

interface BaseBarChartProps {
  data: BarDataPoint[];
  bars: BarConfig[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  height?: number;
}

/**
 * BaseBarChart - Reusable bar chart component with dark mode support
 * Supports multiple bars, stacked bars, custom formatting, and responsive design
 */
export const BaseBarChart: React.FC<BaseBarChartProps> = ({
  data,
  bars,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  formatYAxis = (value) => formatCurrency(value),
  formatTooltip = (value) => formatCurrency(value),
  height = 300,
}) => {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const palette = getColorPalette(theme);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div
        className="rounded-lg border p-3 shadow-lg"
        style={{
          backgroundColor: colors.tooltip,
          borderColor: colors.tooltipBorder,
        }}
      >
        <p
          className="font-semibold mb-2"
          style={{ color: colors.text }}
        >
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatTooltip(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        )}
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey="name"
              stroke={colors.axis}
              style={{ fontSize: '12px', fill: colors.text }}
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: colors.text }
                  : undefined
              }
            />
            <YAxis
              stroke={colors.axis}
              style={{ fontSize: '12px', fill: colors.text }}
              tickFormatter={formatYAxis}
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: colors.text }
                  : undefined
              }
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              stroke={colors.axis}
              style={{ fontSize: '12px', fill: colors.text }}
              tickFormatter={formatYAxis}
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: colors.text }
                  : undefined
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={colors.axis}
              style={{ fontSize: '12px', fill: colors.text }}
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: colors.text }
                  : undefined
              }
            />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '12px', color: colors.text }}
            iconType="rect"
          />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || palette[index % palette.length]}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
