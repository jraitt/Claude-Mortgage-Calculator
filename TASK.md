# TASK.md

**Last Updated**: 2025-10-22

This file tracks all tasks for the Claude Mortgage Calculator project. Tasks are organized by status and priority.

---

## 🔴 Critical Priority

### TASK-001: Refactor MortgageCalculator.tsx (URGENT) ✅ COMPLETE
**Added**: 2025-10-12
**Updated**: 2025-10-22
**Completed**: 2025-10-22
**Status**: ✅ COMPLETE
**Priority**: Critical
**Effort**: Large (All 5 Phases Complete)

**Description**: The main `MortgageCalculator.tsx` component was 2,415 lines, violating the project's 500-line limit. Successfully refactored into modular, testable components.

**Final Results**:
- **Original Size**: 2,415 lines
- **Refactored Size**: 361 lines
- **Reduction**: 85% smaller (2,054 lines extracted)
- **Build Status**: ✅ PASSING
- **Runtime Status**: ✅ WORKING

**Completion Summary**:
- ✅ Phase 1: Extracted calculation functions (~530 lines)
  - basicCalculations.ts - Core payment, PMI, escrow, LTV calculations
  - amortizationSchedule.ts - Schedule generation with paydown strategies
  - pointsCalculations.ts - Points break-even analysis
  - refinanceCalculations.ts - Refinance break-even analysis
- ✅ Phase 2: Created custom hooks (~343 lines)
  - useMortgageInputs - Input state and localStorage persistence
  - usePointsCalculator - Points scenarios management
  - useRefinanceCalculator - Refinance state and validation
- ✅ Phase 3: Created formatting utilities (76 lines)
  - formatCurrency, formatNumber, formatPercentage, etc.
- ✅ Phase 4: Refactored main component (361 lines)
  - Uses all extracted utilities and hooks
  - Clean, focused component
  - All features preserved
- ✅ Phase 5: Testing & Verification
  - Docker build: PASSED
  - TypeScript compilation: PASSED
  - Runtime: WORKING at localhost:3000
  - All functionality verified

**Acceptance Criteria**: ✅ ALL COMPLETE
- [x] Extract calculation logic to `utils/calculations/`
- [x] Create custom hooks in `hooks/`
- [x] Extract formatting utilities
- [x] Refactor main MortgageCalculator component (361 lines - meets goal)
- [x] Ensure all functionality remains intact
- [x] All imports properly configured
- [x] Tests and build passing
- [x] Preserved original as backup (MortgageCalculator.tsx.backup)

**Suggested File Structure**:
```
utils/calculations/
  ├── mortgageCalculations.ts    # Core payment calculations
  ├── amortization.ts             # Schedule generation
  ├── paydownStrategies.ts        # Strategy calculations
  └── pointsAnalysis.ts           # Break-even analysis

hooks/
  ├── useMortgageInputs.ts        # Input state management
  └── useMortgageCalculations.ts  # Memoized calculations

components/mortgage/
  ├── MortgageCalculator.tsx      # Main container (< 200 lines)
  ├── InputForm.tsx               # Loan input form
  ├── tabs/
  │   ├── CalculatorTab.tsx
  │   ├── AmortizationTab.tsx
  │   ├── PaydownStrategiesTab.tsx
  │   ├── PointsCalculatorTab.tsx
  │   ├── RefinanceCalculatorTab.tsx
  │   ├── ScheduleComparisonTab.tsx
  │   └── AnalysisTab.tsx

types/
  └── mortgage.types.ts           # All TypeScript interfaces
```

---

## 🟠 High Priority

### TASK-002: Expand Testing Coverage
**Added**: 2025-10-12
**Updated**: 2025-10-22
**Status**: 🔵 In Progress
**Priority**: High
**Effort**: Medium (1-2 days)

**Description**: Initial testing framework is set up with Jest + React Testing Library. Tests exist for validation and some calculations, but need comprehensive coverage.

**Acceptance Criteria**:
- [x] Install and configure Jest
- [x] Install and configure React Testing Library
- [x] Create `utils/__tests__/` directory structure
- [x] Add test scripts to `package.json`
- [x] Write tests for validation utilities
- [x] Write tests for refinance calculations
- [ ] Write unit tests for all calculation functions (80%+ coverage)
- [ ] Write component tests for main UI components
- [ ] Document testing approach in README.md
- [ ] Set up GitHub Actions to run tests on PR

**Example Tests Needed**:
- `calculateMonthlyPayment()` - happy path, edge cases, zero values
- `generateAmortizationSchedule()` - various term lengths
- `InputForm` - user input validation
- `PaydownStrategiesTab` - strategy comparison rendering

**Blocked By**: TASK-001 (refactoring will make testing easier)

---

### TASK-003: Expand Input Validation
**Added**: 2025-10-12
**Updated**: 2025-10-22
**Status**: 🔵 In Progress
**Priority**: High
**Effort**: Small (4-6 hours)

**Description**: Validation utilities and constants are implemented for refinance calculator. Need to extend validation to all tabs and add visual feedback.

**Acceptance Criteria**:
- [x] Create validation utilities in `utils/validation.ts`
- [x] Create constants file with validation limits
- [x] Validate refinance calculator inputs
- [x] Write tests for validation functions
- [ ] Apply validation to Calculator tab inputs
- [ ] Apply validation to Points Calculator tab
- [ ] Apply validation to Paydown Strategies tab
- [ ] Display inline error messages for all tabs
- [ ] Disable calculate/submit buttons if inputs invalid
- [ ] Add error boundary component for app-level errors

---

## 🟡 Medium Priority

### TASK-004: Improve Mobile Responsiveness
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Medium
**Effort**: Small (4-6 hours)

**Description**: While the app uses Tailwind responsive classes, some tables and forms could be better optimized for mobile screens.

**Acceptance Criteria**:
- [ ] Test app on common mobile screen sizes (375px, 414px, etc.)
- [ ] Make amortization table horizontally scrollable on mobile
- [ ] Stack input form fields vertically on small screens
- [ ] Ensure tab navigation works on mobile
- [ ] Test touch interactions for all buttons
- [ ] Add viewport meta tags if missing
- [ ] Verify dark mode looks good on mobile

---

### TASK-005: Add Print Styles
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Medium
**Effort**: Small (2-3 hours)

**Description**: Users may want to print amortization schedules and analysis reports. Need print-friendly CSS.

**Acceptance Criteria**:
- [ ] Create `@media print` styles in `globals.css`
- [ ] Hide navigation and non-essential UI when printing
- [ ] Format tables to print cleanly
- [ ] Include loan details at top of print page
- [ ] Add "Print" button to relevant tabs
- [ ] Test print preview in multiple browsers

---

### TASK-006: Add Chart Visualizations
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Medium
**Effort**: Medium (1 day)

**Description**: Add visual charts to help users understand paydown strategies and interest breakdown.

**Acceptance Criteria**:
- [ ] Research lightweight chart library (Chart.js, Recharts, or visx)
- [ ] Add dependency to `package.json`
- [ ] Create principal vs interest pie chart
- [ ] Create paydown strategy comparison bar chart
- [ ] Create balance over time line chart
- [ ] Add charts to Analysis tab
- [ ] Ensure charts work with dark mode
- [ ] Make charts responsive

---

## 🟢 Low Priority / Future Enhancements

### TASK-007: Add Session Persistence
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Low
**Effort**: Small (3-4 hours)

**Description**: Save user inputs to localStorage so they persist across browser sessions.

**Acceptance Criteria**:
- [ ] Save inputs to localStorage on change (debounced)
- [ ] Load inputs from localStorage on mount
- [ ] Add "Clear All" button to reset
- [ ] Handle localStorage quota exceeded errors
- [ ] Add privacy note about local storage

---

### TASK-008: Accessibility Audit & Improvements
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Low
**Effort**: Medium (1 day)

**Description**: Ensure app meets WCAG 2.1 AA standards for accessibility.

**Acceptance Criteria**:
- [ ] Run Lighthouse accessibility audit
- [ ] Fix all critical accessibility issues
- [ ] Add proper ARIA labels to form inputs
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Verify color contrast ratios
- [ ] Add skip navigation link
- [ ] Document accessibility features in README

---

### TASK-009: Loan Comparison Feature
**Added**: 2025-10-12
**Status**: 🟡 Not Started
**Priority**: Low
**Effort**: Large (2-3 days)

**Description**: Allow users to save and compare multiple loan scenarios side-by-side.

**Acceptance Criteria**:
- [ ] Design UI for multiple scenario management
- [ ] Implement scenario save/load functionality
- [ ] Create comparison view showing all scenarios
- [ ] Allow naming scenarios (e.g., "15-year", "30-year")
- [ ] Export all scenarios to single CSV
- [ ] Store scenarios in localStorage or database

---

### TASK-011: Improve Refinance Calculator
**Added**: 2025-10-22
**Status**: 🟡 Not Started
**Priority**: Low
**Effort**: Medium (1 day)

**Description**: Enhance the existing refinance calculator with additional features and improvements.

**Acceptance Criteria**:
- [ ] Add PMI consideration in refinance analysis
- [ ] Include tax implications of refinancing
- [ ] Add scenario saving/comparison
- [ ] Improve visual presentation of break-even analysis
- [ ] Add charts showing cost over time
- [ ] Export refinance analysis to PDF

---

## ✅ Completed Tasks

### TASK-101: Create Project Documentation ✅
**Added**: 2025-10-12
**Completed**: 2025-10-12
**Description**: Created `PLANNING.md`, `TASK.md`, and `README.md` to document project architecture, goals, and tasks.

### TASK-102: Add Points Calculator Tab ✅
**Added**: 2025-10-08
**Completed**: 2025-10-09
**Description**: Implemented Points Calculator tab with break-even analysis for comparing different rate/points scenarios.

### TASK-103: Add Dark/Light Theme Toggle ✅
**Added**: 2025-10-07
**Completed**: 2025-10-07
**Description**: Implemented theme toggle with React Context, localStorage persistence, and comprehensive dark mode styling.

### TASK-104: Add CSV Export Functionality ✅
**Added**: 2025-09-15
**Completed**: 2025-09-15
**Description**: Added CSV export feature to download amortization schedules and analysis data.

### TASK-105: Fix Input NaN Errors ✅
**Added**: 2025-10-08
**Completed**: 2025-10-08
**Description**: Fixed issues where empty inputs showed 'NaN' or sticky '0' values. Applied empty string pattern to all numeric inputs.

### TASK-106: Add Refinance Calculator Tab ✅
**Added**: 2025-10-21
**Completed**: 2025-10-21
**PR**: #4
**Description**: Implemented comprehensive Refinance Calculator tab with break-even analysis, monthly payment comparison, cost comparisons at multiple time horizons, smart recommendations, and cash-out refinancing support. Fully integrated with dark mode and responsive design.

### TASK-107: Add Input Validation Utilities ✅
**Added**: 2025-10-21
**Completed**: 2025-10-21
**PR**: #4
**Description**: Created `utils/validation.ts` with comprehensive input validation functions and `utils/constants.ts` with validation limits and application constants. Added unit tests for all validation functions.

### TASK-108: Set Up Testing Framework ✅
**Added**: 2025-10-21
**Completed**: 2025-10-21
**PR**: #4
**Description**: Configured Jest and React Testing Library. Created test files for validation and calculation utilities with comprehensive test coverage including happy paths, edge cases, and error scenarios.

---

## 📋 Task Statuses

- 🟡 **Not Started** - Task defined but work hasn't begun
- 🔵 **In Progress** - Currently being worked on
- 🟢 **Testing** - Implementation complete, undergoing testing
- 🔴 **Blocked** - Waiting on another task or external dependency
- ✅ **Completed** - Finished and verified

---

## 💡 Discovered During Work

This section captures new tasks discovered while working on other tasks.

*(None yet)*

---

## 📝 Notes for Future Development

1. **Before starting TASK-002 (Testing)**, complete TASK-001 (Refactoring) to make testing easier
2. **Consider using Zod** for input validation in TASK-003 instead of manual validation
3. **For TASK-006 (Charts)**, consider using Recharts as it's already React-based and works well with TypeScript
4. **For TASK-009 (Loan Comparison)**, consider using IndexedDB instead of localStorage for larger datasets
5. **GitHub Issues Integration**: Consider moving to GitHub Issues for better tracking once refactoring is complete

---

## 🎯 Next Steps (Recommended Order)

1. **TASK-001** - Refactor MortgageCalculator.tsx (Critical - now ~2350 lines)
2. **TASK-003** - Expand input validation to all tabs (Partial implementation done)
3. **TASK-002** - Expand testing coverage (Framework setup, need more tests)
4. **TASK-004** - Improve mobile responsiveness
5. **TASK-006** - Add chart visualizations

---

Last Updated: 2025-10-22
