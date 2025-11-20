'use client'

import React from 'react';
import {
  AreaChart,
  Area,
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

export interface AreaDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface AreaConfig {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
  fillOpacity?: number;
}

interface BaseAreaChartProps {
  data: AreaDataPoint[];
  areas: AreaConfig[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  height?: number;
}

/**
 * BaseAreaChart - Reusable area chart component with dark mode support
 * Supports multiple areas, stacked areas, custom formatting, and responsive design
 */
export const BaseAreaChart: React.FC<BaseAreaChartProps> = ({
  data,
  areas,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = true,
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
      <AreaChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        )}
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
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '12px', color: colors.text }}
            iconType="rect"
          />
        )}
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stroke={area.color || palette[index % palette.length]}
            fill={area.color || palette[index % palette.length]}
            fillOpacity={area.fillOpacity !== undefined ? area.fillOpacity : 0.6}
            stackId={area.stackId}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};
