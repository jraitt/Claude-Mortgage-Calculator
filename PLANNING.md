# PLANNING.md

## Project Overview

**Mortgage Tools Pro** is a comprehensive Next.js web application that provides advanced mortgage calculations, amortization schedules, paydown strategies, and break-even analysis for mortgage points. The application is designed to help homebuyers and homeowners make informed decisions about their mortgage financing.

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
├─ app/
│  ├─ globals.css              # Global styles & Tailwind imports
│  ├─ layout.tsx               # Root layout with ThemeProvider
│  └─ page.tsx                 # Home page that renders MortgageCalculator
├─ components/
│  ├─ MortgageCalculator.tsx   # Orchestrator (state + tab wiring)
│  ├─ tabs/
│  │  ├─ CalcTabNewMortgage.tsx
│  │  ├─ CalcTabExistingMortgage.tsx
│  │  ├─ CalcTabPoints.tsx
│  │  ├─ CalcTabRefinance.tsx
│  │  └─ index.ts
│  └─ shared/
│     ├─ FormField.tsx
│     ├─ SummaryCard.tsx
│     ├─ DataTable.tsx
│     └─ index.ts
├─ contexts/
│  └─ ThemeContext.tsx
├─ utils/
│  ├─ calculations/
│  │  ├─ basicCalculations.ts
│  │  ├─ amortizationSchedule.ts
│  │  ├─ pointsCalculations.ts
│  │  └─ refinanceCalculations.ts
│  ├─ hooks/
│  │  ├─ useCalculations.ts
│  │  └─ useLocalStorage.ts
│  ├─ csvExport.ts
│  ├─ constants.ts
│  ├─ formatting.ts
│  └─ validation.ts
├─ utils/__tests__/
│  ├─ calculations.test.ts
│  └─ validation.test.ts
├─ Dockerfile
├─ docker-compose.yml
├─ next.config.js
├─ tailwind.config.js
├─ tsconfig.json
├─ package.json
├─ CLAUDE.md
├─ PLANNING.md
├─ TASK.md
└─ README.md
```

### Component Architecture

The TASK-001 refactor is complete, so the codebase now follows a modular architecture:

1. **MortgageCalculator Orchestrator**
   - Keeps tab state, shares data between calculators, drives CSV exports, and persists inputs with `useLocalStorage`
2. **Tab Components (`components/tabs/`)**
   - Dedicated files for New Mortgage, Existing Mortgage, Points, and Refinance scenarios so each feature stays ~250–450 lines
3. **Shared Components (`components/shared/`)**
   - `FormField`, `SummaryCard`, and `DataTable` centralize common UI patterns and styling
4. **Custom Hooks (`utils/hooks/`)**
   - `useCalculations` exposes `useBasicMetrics`, `useAmortizationSchedules`, and `usePointsComparison`
   - `useLocalStorage` wraps persistence logic used by the orchestrator and tabs
5. **Calculation Modules (`utils/calculations/`)**
   - Pure functions for payment math, amortization, points, and refinance analysis keep heavy logic outside React components

This structure enforces the <500 line guideline, improves testability, and lets new tabs slot in without touching existing views.

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

1. **New Mortgage (CalcTabNewMortgage)**
   - Primary loan inputs, SummaryCard metrics, and on-demand amortization schedule with CSV export
2. **Existing Mortgage (CalcTabExistingMortgage)**
   - Paydown strategy controls (bi-weekly, extra principal, double payments) plus side-by-side schedule comparison and savings insights
3. **Points Calculator (CalcTabPoints)**
   - Multi-scenario management with baseline selection, break-even analysis, and cost comparisons at multiple time horizons
4. **Refinance (CalcTabRefinance)**
   - Auto-imports current loan data, compares new terms/closing costs, models cash-out, and surfaces break-even + recommendation copy

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
   - Refactor completed in TASK-001 keeps `MortgageCalculator.tsx` at ~410 lines—maintain this standard for all new code

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
1. **Expand Testing** - Cover hooks, shared components, tab components, and wire tests into CI (TASK-002)
2. **Expand Input Validation** - Apply the validation utilities + FormField messaging across every tab (TASK-003)
3. **Mobile & Accessibility Improvements** - Tighten responsive layouts, keyboard flows, and contrast (TASK-004 & TASK-008)
4. **Performance Audit** - Profile renders and add memoization/react memo where needed (TASK-010)

### Medium Priority
5. **Chart Visualization** - Add charts for paydown strategies and refinance comparisons (TASK-006)
6. **Session Persistence** - Allow saving/restoring scenarios via localStorage presets
7. **Print-Friendly Styles** - Create printer-focused layouts for schedules and summaries
8. **Loan Comparison Workspace** - Let users save and compare multiple loan setups side-by-side

### Low Priority
9. **User Accounts** - Optional sign-in to sync scenarios across devices
10. **Sharing** - Generate shareable links or exports tailored to advisors
11. **Advanced PMI Handling** - Automatically remove PMI at 80% LTV and support lender-specific rules

## Known Issues & Technical Debt

### Critical
1. **Limited Testing** - Hooks, shared components, and tab components still lack automated coverage
2. **Partial Validation** - Only the refinance flow uses the new validation helpers; other tabs need parity

### Important
3. **No Error Boundaries** - Add a top-level error boundary to prevent full-app crashes
4. **Accessibility Gaps** - Need Lighthouse/keyboard audits plus ARIA updates to shared inputs
5. **Mobile Responsiveness** - Data-heavy tables require better small-screen layouts

### Minor
6. **Console Warnings** - Occasional dev-time warnings about unused variables or dependency arrays
7. **CSV UX Enhancements** - Filenames and column selections could be more descriptive per tab
8. **Perceived Loading States** - Long schedules can appear frozen without explicit progress indicators

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

Last Updated: 2025-10-24
