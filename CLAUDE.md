# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based mortgage calculator application that provides comprehensive loan analysis and paydown strategies. The application is built with React, TypeScript, and Tailwind CSS, featuring a single-page application with tabbed interface for different calculation views.

**CRITICAL: This is a Docker-first project. All development, testing, and building should be done using Docker and Docker Compose.**

## Architecture

The application follows a modular Next.js App Router structure with a well-organized component hierarchy:

### Directory Structure
- `app/` - Next.js 13+ app directory with layout and page components
- `components/` - Reusable React components
  - `MortgageCalculator.tsx` - Main calculator orchestrator (~410 lines)
  - `tabs/` - Individual tab components for different calculators
  - `shared/` - Reusable UI components (FormField, SummaryCard, DataTable)
- `contexts/` - React contexts for global state (theme management)
- `utils/` - Utility functions organized by concern
  - `calculations/` - Calculation logic modules
  - `hooks/` - Custom React hooks for calculations and state
  - `csvExport.ts` - CSV export functionality
  - `constants.ts` - Application constants and limits
  - `validation.ts` - Input validation functions
  - `formatting.ts` - Number and currency formatting

### Component Architecture

The application has been refactored from a monolithic 2,273-line component into a modular structure:

**Main Component** (`MortgageCalculator.tsx` - ~410 lines):
- Orchestrates state management and tab navigation
- Uses custom hooks for complex calculations
- Delegates UI rendering to specialized tab components

**Tab Components** (`components/tabs/`):
- `CalcTabNewMortgage.tsx` - New mortgage calculator with amortization schedule
- `CalcTabExistingMortgage.tsx` - Existing mortgage with paydown strategies
- `CalcTabPoints.tsx` - Points calculator with break-even analysis
- `CalcTabRefinance.tsx` - Refinance calculator with detailed comparisons

**Shared Components** (`components/shared/`):
- `FormField.tsx` - Generic input wrapper (text, number, date, select)
- `SummaryCard.tsx` - Color-coded metric display cards
- `DataTable.tsx` - Reusable table component with sticky headers

**Custom Hooks** (`utils/hooks/`):
- `useCalculations.ts` - Mortgage calculation logic
  - `useBasicMetrics()` - Loan amount, rates, PMI, escrow
  - `useAmortizationSchedules()` - Generate payment schedules
  - `usePointsComparison()` - Points break-even analysis
- `useLocalStorage.ts` - Persistent state management

**Calculation Utilities** (`utils/calculations/`):
- `basicCalculations.ts` - Core mortgage math
- `amortizationSchedule.ts` - Payment schedule generation
- `pointsCalculations.ts` - Points comparison logic
- `refinanceCalculations.ts` - Refinance analysis

### Features by Tab

1. **New Mortgage**: Loan details input, payment breakdown, full amortization schedule
2. **Existing Mortgage**: Paydown strategy comparison (bi-weekly, extra payments, double principal)
3. **Points Calculator**: Multi-scenario comparison with break-even analysis
4. **Refinance Calculator**: Current vs. new loan comparison with recommendations

## Common Development Commands

**Docker Commands (REQUIRED)**:

```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after code/dependency changes
docker compose up -d --build

# Stop the container
docker compose down

# Run tests
docker compose exec mortgage-calculator npm test

# Run tests in watch mode
docker compose exec mortgage-calculator npm run test:watch

# Run linting
docker compose exec mortgage-calculator npm run lint

# Build for production
docker compose exec mortgage-calculator npm run build

# Access container shell (if needed)
docker compose exec mortgage-calculator sh
```

**Non-Docker Commands (NOT RECOMMENDED - Use Docker instead)**:

```bash
# Only use these if Docker is unavailable
npm install
npm run dev
npm run build
npm start
npm run lint
npm test
```

## Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Icon library for UI components
- **React Hooks** - Custom hooks for calculations and state management
- **Jest** - Testing framework for unit tests
- **React Testing Library** - Component testing utilities

## Development Notes

- The application uses client-side rendering (`'use client'`) for interactive components
- State management is handled with React hooks (no external state management library)
- All calculations are performed client-side using custom hooks
- Performance optimized with `useMemo` for expensive calculations
- Responsive design implemented with Tailwind CSS
- Input validation utilities are available in `utils/validation.ts`
- Application constants are centralized in `utils/constants.ts`
- Theme management uses React Context with localStorage persistence
- Components follow a consistent props interface pattern for maintainability

## Docker-First Architecture

**CRITICAL**: This project follows a Docker-first development approach. All development work should be done using Docker.

Docker configuration:
- `Dockerfile` - Node.js 18 Alpine-based container optimized for production
- `docker-compose.yml` - Development environment setup
- Container exposes port 3000 for the Next.js application
- Hot reload enabled for development
- Volume mounts for live code updates

**Why Docker-First?**
- Ensures consistent development environment across all developers
- Eliminates "works on my machine" issues
- Matches production deployment environment
- Simplifies onboarding for new developers
- Easier dependency management

## File Structure

```
mortgage-calculator/
├── app/
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout with metadata and ThemeProvider
│   └── page.tsx        # Home page (imports MortgageCalculator)
├── components/
│   ├── MortgageCalculator.tsx  # Main orchestrator (~410 lines)
│   ├── tabs/
│   │   ├── CalcTabNewMortgage.tsx      # New mortgage tab
│   │   ├── CalcTabExistingMortgage.tsx # Existing mortgage tab
│   │   ├── CalcTabPoints.tsx           # Points calculator tab
│   │   ├── CalcTabRefinance.tsx        # Refinance calculator tab
│   │   └── index.ts                    # Tab exports
│   └── shared/
│       ├── FormField.tsx     # Generic input component
│       ├── SummaryCard.tsx   # Metric display card
│       ├── DataTable.tsx     # Reusable table
│       └── index.ts          # Shared component exports
├── contexts/
│   └── ThemeContext.tsx  # Theme state management
├── utils/
│   ├── calculations/
│   │   ├── basicCalculations.ts      # Core mortgage math
│   │   ├── amortizationSchedule.ts   # Schedule generation
│   │   ├── pointsCalculations.ts     # Points analysis
│   │   └── refinanceCalculations.ts  # Refinance logic
│   ├── hooks/
│   │   ├── useCalculations.ts  # Calculation hooks
│   │   └── useLocalStorage.ts  # Persistent state hook
│   ├── csvExport.ts    # CSV export utilities
│   ├── constants.ts    # Application constants and limits
│   ├── formatting.ts   # Number/currency formatting
│   ├── validation.ts   # Input validation functions
│   └── __tests__/
│       ├── calculations.test.ts  # Calculation tests
│       └── validation.test.ts    # Validation tests
├── Dockerfile
├── docker-compose.yml
├── jest.config.js      # Jest configuration
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies and scripts
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── CLAUDE.md           # This file - guidance for Claude Code
├── PLANNING.md         # Architecture and planning
├── TASK.md             # Task tracking
└── README.md           # User documentation
```

## Testing

Testing framework is configured using Jest and React Testing Library:
- **Unit Tests**: Located in `utils/__tests__/`
- **Run Tests**: `docker compose exec mortgage-calculator npm test`
- **Coverage**: Partial coverage - validation and some calculation utilities
- **Needed**: Component tests, full calculation coverage, integration tests

When adding new features:
1. Write tests in `__tests__/` directory next to the code
2. Follow existing test patterns (happy path, edge cases, errors)
3. Run tests before committing: `docker compose exec mortgage-calculator npm test`

## Code Organization Principles

1. **Separation of Concerns**: UI components, business logic, and utilities are separate
2. **Reusability**: Shared components and hooks reduce duplication
3. **Testability**: Pure functions and isolated logic are easy to test
4. **Maintainability**: Smaller files (~200-400 lines) are easier to understand
5. **Type Safety**: TypeScript interfaces define clear contracts between components
6. **Performance**: Custom hooks with memoization prevent unnecessary recalculations
