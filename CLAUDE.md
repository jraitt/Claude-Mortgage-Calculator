# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based mortgage calculator application that provides comprehensive loan analysis and paydown strategies. The application is built with React, TypeScript, and Tailwind CSS, featuring a single-page application with tabbed interface for different calculation views.

## Architecture

The application follows a typical Next.js App Router structure:
- `app/` - Next.js 13+ app directory with layout and page components
- `components/` - Reusable React components (currently contains the main MortgageCalculator component)
- Main component: `components/MortgageCalculator.tsx` - A comprehensive mortgage calculator with tabs for calculator, amortization schedule, paydown strategies, and analysis

The MortgageCalculator component is a large client-side component that handles:
- Loan calculations (monthly payments, PMI, escrow)
- Amortization schedule generation
- Multiple paydown strategies (bi-weekly, extra payments, double principal)
- Interactive tabbed interface with Calculator, Amortization, Paydown Strategies, and Analysis views

## Common Development Commands

```bash
# Navigate to the project directory
cd mortgage-calculator

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Icon library for UI components
- **React Hooks** - useState, useEffect, useMemo for state management and calculations

## Development Notes

- The application uses client-side rendering (`'use client'`) for the main calculator component
- State management is handled with React hooks (no external state management library)
- All calculations are performed client-side using JavaScript math operations
- The component uses `useMemo` for performance optimization of expensive calculations
- Responsive design implemented with Tailwind CSS grid and responsive classes

## Docker Support

The application includes Docker configuration:
- `Dockerfile` - Node.js 18 Alpine-based container
- `docker-compose.yml` - Development environment setup
- Container exposes port 3000 for the Next.js application

## File Structure

```
mortgage-calculator/
├── app/
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Home page (imports MortgageCalculator)
├── components/
│   └── MortgageCalculator.tsx  # Main calculator component
├── Dockerfile
├── docker-compose.yml
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies and scripts
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Testing

No testing framework is currently configured. If adding tests, consider:
- Jest for unit testing
- React Testing Library for component testing
- Cypress or Playwright for e2e testing