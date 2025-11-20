'use client'

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ChartContainerProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showLegend?: boolean;
  height?: number;
}

/**
 * ChartContainer - A reusable wrapper for all chart components
 * Provides consistent styling, dark mode support, and optional title/legend
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  className = '',
  showLegend = true,
  height = 300,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-lg border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      } p-4 ${className}`}
    >
      {title && (
        <h3
          className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>
      )}
      <div style={{ height: `${height}px` }} className="w-full">
        {children}
      </div>
    </div>
  );
};

/**
 * Chart color palette for light and dark modes
 * Ensures consistent, accessible colors across all charts
 */
export const CHART_COLORS = {
  light: {
    // Primary data series colors
    primary: '#3b82f6',      // blue-500
    secondary: '#10b981',    // green-500
    tertiary: '#f59e0b',     // amber-500
    quaternary: '#ef4444',   // red-500
    quinary: '#8b5cf6',      // violet-500
    senary: '#ec4899',       // pink-500

    // Semantic colors
    success: '#10b981',      // green-500
    warning: '#f59e0b',      // amber-500
    danger: '#ef4444',       // red-500
    info: '#3b82f6',         // blue-500

    // Chart-specific colors
    principal: '#3b82f6',    // blue-500
    interest: '#ef4444',     // red-500
    pmi: '#f59e0b',          // amber-500
    escrow: '#10b981',       // green-500

    // Comparison colors
    current: '#3b82f6',      // blue-500
    new: '#10b981',          // green-500
    comparison: '#f59e0b',   // amber-500

    // UI elements
    grid: '#e5e7eb',         // gray-200
    axis: '#6b7280',         // gray-500
    text: '#1f2937',         // gray-800
    tooltip: '#ffffff',      // white
    tooltipBorder: '#d1d5db', // gray-300
  },
  dark: {
    // Primary data series colors (brighter for dark mode)
    primary: '#60a5fa',      // blue-400
    secondary: '#34d399',    // green-400
    tertiary: '#fbbf24',     // amber-400
    quaternary: '#f87171',   // red-400
    quinary: '#a78bfa',      // violet-400
    senary: '#f472b6',       // pink-400

    // Semantic colors
    success: '#34d399',      // green-400
    warning: '#fbbf24',      // amber-400
    danger: '#f87171',       // red-400
    info: '#60a5fa',         // blue-400

    // Chart-specific colors
    principal: '#60a5fa',    // blue-400
    interest: '#f87171',     // red-400
    pmi: '#fbbf24',          // amber-400
    escrow: '#34d399',       // green-400

    // Comparison colors
    current: '#60a5fa',      // blue-400
    new: '#34d399',          // green-400
    comparison: '#fbbf24',   // amber-400

    // UI elements
    grid: '#374151',         // gray-700
    axis: '#9ca3af',         // gray-400
    text: '#f3f4f6',         // gray-100
    tooltip: '#1f2937',      // gray-800
    tooltipBorder: '#4b5563', // gray-600
  },
};

/**
 * Get chart colors based on current theme
 */
export const getChartColors = (theme: 'light' | 'dark') => {
  return CHART_COLORS[theme];
};

/**
 * Chart color arrays for multi-series charts
 */
export const getColorPalette = (theme: 'light' | 'dark') => {
  const colors = CHART_COLORS[theme];
  return [
    colors.primary,
    colors.secondary,
    colors.tertiary,
    colors.quaternary,
    colors.quinary,
    colors.senary,
  ];
};
