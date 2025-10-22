# PLANNING.md

## Project Overview

**Claude Mortgage Calculator** is a comprehensive Next.js web application that provides advanced mortgage calculations, amortization schedules, paydown strategies, and break-even analysis for mortgage points. The application is designed to help homebuyers and homeowners make informed decisions about their mortgage financing.

**Live URL**: `https://mortgagecalc.compound-interests.com`
**Repository**: `https://github.com/jraitt/Claude-Mortgage-Calculator`

**CRITICAL: Docker-First Development**
This project follows a Docker-first development approach. All development, testing, and building should be done using Docker and Docker Compose to ensure consistency across environments and match production deployment.

---

## Project Goals

### Primary Goals
1. **Accurate Financial Calculations**: Provide precise mortgage calculations including principal, interest, PMI, taxes, and insurance
2. **Strategy Comparison**: Enable users to compare different paydown strategies (bi-weekly payments, extra principal, double principal)
3. **Points Analysis**: Help users understand the break-even point for paying mortgage points
4. **Data Export**: Allow users to export amortization schedules and analysis data to CSV
5. **User Experience**: Deliver a clean, intuitive interface with dark/light theme support
6. **Accessibility**: Ensure the application is responsive and works across devices

### Secondary Goals
1. **Performance**: Optimize calculations using React useMemo for large datasets
2. **Maintainability**: Keep code modular and well-documented
3. **Deployment**: Support Docker-based deployment for easy hosting
4. **Testing**: (Future) Implement comprehensive unit and integration tests

---

## Architecture

### Technology Stack

**Frontend Framework**
- **Next.js 14** (App Router) - React framework with server/client components
- **React 18** - Component library with hooks
- **TypeScript 5** - Type safety throughout the application

**Styling & UI**
- **Tailwind CSS 3** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Custom Theme System** - Light/dark mode with React Context

**Build & Development**
- **Docker** - Primary development and deployment platform (REQUIRED)
- **Docker Compose** - Development environment orchestration (REQUIRED)
- **Node.js 18+** - Runtime environment (runs inside Docker container)
- **npm** - Package manager (runs inside Docker container)

### Project Structure

```
mortgage-calculator/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles & Tailwind imports
│   ├── layout.tsx               # Root layout with ThemeProvider
│   └── page.tsx                 # Home page (imports MortgageCalculator)
│
├── components/                   # React components
│   └── MortgageCalculator.tsx   # Main calculator (1787 lines - NEEDS REFACTORING)
│
├── contexts/                     # React contexts
│   └── ThemeContext.tsx         # Theme state management
│
├── utils/                        # Utility functions
│   ├── csvExport.ts             # CSV generation and download utilities
│   ├── constants.ts             # Application constants and validation limits
│   ├── validation.ts            # Input validation utilities
│   └── __tests__/               # Unit tests for utilities
│       ├── calculations.test.ts # Tests for calculation functions
│       └── validation.test.ts   # Tests for validation functions
│
├── .claude/                      # Claude Code configuration
│
├── Dockerfile                    # Docker image configuration
├── docker-compose.yml            # Docker compose setup
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
│
├── CLAUDE.md                     # Project guidance for Claude Code
├── PLANNING.md                   # This file - architecture and goals
├── TASK.md                       # Task tracking
└── README.md                     # User-facing documentation
```

### Component Architecture

**Current State (Monolithic)**
- `MortgageCalculator.tsx` (~2350 lines) - Contains ALL functionality:
  - Input form and state management
  - Calculation logic for all scenarios
  - Amortization schedule generation
  - Paydown strategy calculations
  - Points calculator logic
  - Refinance calculator logic
  - CSV export functionality
  - Tab navigation and UI rendering

**Planned Refactoring (Modular)**
The component exceeds the 500-line limit and should be split into:

1. **Core Calculator Logic** (`utils/calculations/`)
   - `mortgageCalculations.ts` - Monthly payment, PMI, escrow calculations
   - `amortization.ts` - Amortization schedule generation
   - `paydownStrategies.ts` - Bi-weekly, extra payment calculations
   - `pointsAnalysis.ts` - Break-even analysis for mortgage points

2. **State Management** (`hooks/`)
   - `useMortgageInputs.ts` - Input state and validation
   - `useMortgageCalculations.ts` - Memoized calculation results

3. **UI Components** (`components/mortgage/`)
   - `MortgageCalculator.tsx` - Main container (orchestration only)
   - `InputForm.tsx` - Loan input form
   - `CalculatorTab.tsx` - Calculator summary view
   - `AmortizationTab.tsx` - Amortization schedule table
   - `PaydownStrategiesTab.tsx` - Strategy comparison
   - `PointsCalculatorTab.tsx` - Points break-even analysis
   - `AnalysisTab.tsx` - Financial analysis and charts
   - `ScheduleComparisonTab.tsx` - Side-by-side schedule comparison

4. **Types** (`types/`)
   - `mortgage.types.ts` - TypeScript interfaces and types

### Data Flow

```
User Input (Form)
    ↓
State Management (useState)
    ↓
Calculation Logic (useMemo)
    ↓
Results Display (Tabs)
    ↓
Export (CSV Download)
```

### Key Features by Tab

1. **Calculator Tab**
   - Loan inputs (home price, down payment, rate, term)
   - Monthly payment breakdown
   - PMI and escrow calculations
   - Existing loan support (current balance, payments made)

2. **Amortization Tab**
   - Month-by-month payment schedule
   - Principal vs. interest breakdown
   - Running balance
   - Searchable and sortable table

3. **Paydown Strategies Tab**
   - Comparison of different paydown methods:
     - Standard monthly payments
     - Bi-weekly payments
     - Extra monthly principal
     - Double principal payments
     - Extra annual payments
   - Time and interest savings for each strategy

4. **Schedule Comparison Tab**
   - Side-by-side schedule comparison
   - Visual differences between strategies

5. **Points Calculator Tab**
   - Multiple rate/points scenarios
   - Break-even analysis vs. baseline
   - Total cost comparison at 5, 10 years and full term
   - Monthly savings calculations

6. **Refinance Calculator Tab**
   - Auto-populates current loan details
   - New loan term and rate inputs
   - Closing costs and points consideration
   - Cash-out refinancing support
   - Break-even analysis for refinancing
   - Monthly payment comparison
   - Long-term cost comparison (5, 10 years, full term)
   - Smart recommendations based on break-even

7. **Analysis Tab**
   - Total interest paid
   - Total cost of loan
   - Payment breakdown visualization
   - Long-term financial impact

---

## Development Constraints & Standards

### Docker-First Requirement

**CRITICAL**: All development must use Docker:
- Run development server: `docker compose up -d`
- Run tests: `docker compose exec mortgage-calculator npm test`
- Run linting: `docker compose exec mortgage-calculator npm run lint`
- Install dependencies: Rebuild container with `docker compose up -d --build`
- Never run npm commands directly on host machine

### Code Quality Standards

1. **File Length Limit**: Maximum 500 lines per file
   - **CRITICAL**: `MortgageCalculator.tsx` currently has 1787 lines and MUST be refactored

2. **Type Safety**: All functions must have TypeScript type annotations
   - Use interfaces for complex objects
   - Avoid `any` type

3. **Documentation**:
   - Every function must have a JSDoc comment
   - Complex logic must include inline comments explaining "why"
   - Use Google-style docstrings format

4. **Naming Conventions**:
   - Components: PascalCase (e.g., `MortgageCalculator`)
   - Functions: camelCase (e.g., `calculateMonthlyPayment`)
   - Constants: UPPER_SNAKE_CASE (e.g., `MAX_LOAN_TERM`)
   - Files: Match component/function name

5. **React Best Practices**:
   - Use functional components with hooks
   - Memoize expensive calculations with `useMemo`
   - Extract custom hooks for reusable logic
   - Keep components focused on single responsibility

### Testing Standards

**Current Implementation**:
- **Framework**: Jest + React Testing Library (configured)
- **Coverage**: Partial - validation and some calculation utilities
- **Existing Tests**:
  - `utils/__tests__/calculations.test.ts` - Tests for refinance calculations
  - `utils/__tests__/validation.test.ts` - Tests for input validation

**Target Standards**:
- **Coverage Target**: 80% minimum
- **Required Tests**:
  - Unit tests for all calculation functions
  - Component tests for UI interactions
  - Integration tests for data flow
  - Each feature needs: 1 happy path, 1 edge case, 1 failure case

### Git Workflow

- **Main Branch**: `main` (protected, requires PR for changes)
- **Feature Branches**: `feature/description` or `claude/description`
- **Commit Messages**: Follow conventional commits
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `refactor:` - Code refactoring
  - `docs:` - Documentation changes
  - `test:` - Test additions/changes
- **PR Requirements**:
  - Code review before merge
  - All tests must pass: `docker compose exec mortgage-calculator npm test`
  - Linting must pass: `docker compose exec mortgage-calculator npm run lint`
  - Must build successfully: `docker compose up -d --build`

### Performance Considerations

1. **Calculation Performance**:
   - Use `useMemo` for expensive calculations (amortization schedules)
   - Avoid recalculating on every render
   - Consider Web Workers for very large datasets (future)

2. **Bundle Size**:
   - Current bundle is small (minimal dependencies)
   - Use dynamic imports for large components if needed
   - Optimize images and assets

3. **Rendering Performance**:
   - Virtualize large tables if schedule exceeds 1000+ rows
   - Debounce input changes if needed
   - Use React.memo for pure components

---

## Deployment Architecture

### Docker-First Philosophy

This project is built with a Docker-first approach from development through production:

**Development**:
- All developers use Docker Compose for local development
- Ensures consistency: "works on my machine" issues eliminated
- Hot reload enabled for live code updates
- Tests and linting run inside containers

**Production**:
- Same Docker image used in development and production
- Ensures what you test is what you deploy
- Easy rollbacks and version management
- Simplified deployment process

### Production Environment

**Hosting**: Linux server (Ubuntu/Debian)
**Web Server**: Nginx (reverse proxy)
**Application**: Docker container running Next.js (same image as development)
**SSL**: Let's Encrypt (Certbot)
**Domain**: `mortgagecalc.compound-interests.com`

### Docker Configuration

```yaml
# docker-compose.yml
services:
  mortgage-calculator:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    # Development: Add volume mounts for hot reload
    # Production: Use built image without volumes
```

### Nginx Configuration

- Reverse proxy to localhost:3000 (Docker container)
- HTTPS with automatic certificate renewal
- Static asset caching
- Compression enabled

### Deployment Process (Docker-Based)

1. Commit and push changes to GitHub
2. SSH to server
3. Pull latest changes: `git pull`
4. Rebuild and restart container: `docker compose up -d --build`
5. Nginx automatically proxies to updated container
6. Verify deployment: Check logs with `docker compose logs -f`

---

## Future Enhancements

### High Priority
1. **Refactor MortgageCalculator.tsx** - Split into modular components (CRITICAL - now ~2350 lines)
2. **Expand Testing** - Add tests for all calculation functions and components
3. **Expand Input Validation** - Apply validation to all tabs (currently only on refinance)
4. **Mobile Optimization** - Improve responsive design for small screens

### Medium Priority
5. **Save/Load Sessions** - LocalStorage or database persistence
6. **Print Styles** - Printer-friendly amortization schedules
7. **Chart Visualization** - Add graphs for paydown comparison
8. **Loan Comparison** - Compare multiple loan scenarios side-by-side

### Low Priority
9. **User Accounts** - Save multiple scenarios per user
10. **Sharing** - Generate shareable links with encoded loan data
11. **Advanced PMI** - Handle PMI removal at 80% LTV automatically

---

## Known Issues & Technical Debt

### Critical
1. **MortgageCalculator.tsx is ~2350 lines** - Violates 500-line rule, needs immediate refactoring (grew with refinance feature)
2. **Limited Testing** - Only validation and some utilities tested, need full coverage

### Important
3. **Partial Input Validation** - Refinance tab has validation, but other tabs need it too
4. **No Error Boundaries** - App could crash without graceful error handling
5. **Accessibility** - Not fully WCAG compliant, needs audit

### Minor
6. **Console Warnings** - Some unused variables in development
7. **CSV Export Filenames** - Could be more descriptive
8. **No Loading States** - Large calculations appear to freeze UI briefly

---

## Dependencies & Version Management

### Core Dependencies
- `next`: 14.0.0 (stable)
- `react`: ^18 (latest stable)
- `lucide-react`: ^0.263.1 (icon library)
- `jest`: ^29 (testing framework)
- `@testing-library/react`: ^14 (component testing)
- `@testing-library/jest-dom`: ^6 (custom matchers)

### Dev Dependencies
- `typescript`: ^5 (latest)
- `tailwindcss`: ^3 (latest)
- `@types/*`: Latest type definitions

### Update Policy
- **Major versions**: Review breaking changes, test thoroughly
- **Minor versions**: Update monthly
- **Patch versions**: Update weekly (security fixes)

---

## Contact & Support

**Developer**: Claude Code + Human Developer
**Issues**: https://github.com/jraitt/Claude-Mortgage-Calculator/issues
**Discussions**: GitHub Discussions (if enabled)

---

Last Updated: 2025-10-22
