# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based mortgage calculator application that provides comprehensive loan analysis and paydown strategies. The application is built with React, TypeScript, and Tailwind CSS, featuring a single-page application with tabbed interface for different calculation views.

**CRITICAL: This is a Docker-first project. All development, testing, and building should be done using Docker and Docker Compose.**

## Architecture

The application follows a typical Next.js App Router structure:
- `app/` - Next.js 13+ app directory with layout and page components
- `components/` - Reusable React components (currently contains the main MortgageCalculator component)
- `contexts/` - React contexts for global state (theme management)
- `utils/` - Utility functions for calculations, validation, CSV export
- Main component: `components/MortgageCalculator.tsx` - A comprehensive mortgage calculator with tabs

The MortgageCalculator component is a large client-side component (~2350 lines) that handles:
- Loan calculations (monthly payments, PMI, escrow)
- Amortization schedule generation
- Multiple paydown strategies (bi-weekly, extra payments, double principal)
- Mortgage points break-even analysis
- Refinance calculator with break-even analysis
- Interactive tabbed interface with 7 tabs
- Dark/light theme support

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
- **React Hooks** - useState, useEffect, useMemo for state management and calculations
- **Jest** - Testing framework for unit tests
- **React Testing Library** - Component testing utilities

## Development Notes

- The application uses client-side rendering (`'use client'`) for the main calculator component
- State management is handled with React hooks (no external state management library)
- All calculations are performed client-side using JavaScript math operations
- The component uses `useMemo` for performance optimization of expensive calculations
- Responsive design implemented with Tailwind CSS grid and responsive classes
- Input validation utilities are available in `utils/validation.ts`
- Application constants are centralized in `utils/constants.ts`
- Theme management uses React Context with localStorage persistence

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
│   └── MortgageCalculator.tsx  # Main calculator component (~2350 lines)
├── contexts/
│   └── ThemeContext.tsx  # Theme state management
├── utils/
│   ├── csvExport.ts    # CSV export utilities
│   ├── constants.ts    # Application constants and limits
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
- **Run Tests**: `npm test` or `npm run test:watch`
- **Coverage**: Partial coverage - validation and some calculation utilities
- **Needed**: Component tests, full calculation coverage, integration tests

When adding new features:
1. Write tests in `__tests__/` directory next to the code
2. Follow existing test patterns (happy path, edge cases, errors)
3. Run tests before committing: `npm test`