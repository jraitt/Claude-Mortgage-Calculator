import { useMemo } from 'react';
import { MortgageInputs, PointsScenario, RefinanceInputs } from '../../components/MortgageCalculator';
import {
  PMI_LTV_THRESHOLD,
  BIWEEKLY_PERIODS_PER_YEAR,
  MAX_ITERATIONS,
  MINIMUM_BALANCE
} from '../constants';

/**
 * Hook to calculate basic mortgage metrics
 */
export const useBasicMetrics = (inputs: MortgageInputs) => {
  return useMemo(() => {
    const loanAmount = inputs.isExistingLoan
      ? inputs.currentBalance
      : inputs.homePrice - inputs.downPayment;

    const monthlyRate = (inputs.interestRate || 0) / 100 / 12;

    const totalPayments = inputs.isExistingLoan
      ? inputs.loanTerm * 12 - inputs.paymentsMade
      : inputs.loanTerm * 12;

    // Monthly principal and interest payment
    const monthlyPI =
      monthlyRate === 0
        ? loanAmount / totalPayments
        : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // PMI calculation
    const ltvRatio = inputs.isExistingLoan
      ? inputs.originalPrincipal > 0
        ? (inputs.currentBalance / inputs.originalPrincipal) * 100
        : 0
      : inputs.homePrice > 0
      ? (loanAmount / inputs.homePrice) * 100
      : 0;

    const monthlyPMI = inputs.isExistingLoan
      ? inputs.pmiAmount || 0
      : ltvRatio > PMI_LTV_THRESHOLD
      ? (loanAmount * ((inputs.pmiRate || 0) / 100)) / 12
      : 0;

    // Monthly escrow (taxes + insurance)
    const monthlyEscrow = inputs.isExistingLoan
      ? 0
      : ((inputs.propertyTax || 0) + (inputs.homeInsurance || 0)) / 12;

    // Total monthly payment
    const totalMonthlyPayment = monthlyPI + monthlyPMI + monthlyEscrow;

    return {
      loanAmount,
      monthlyRate,
      totalPayments,
      monthlyPI,
      ltvRatio,
      monthlyPMI,
      monthlyEscrow,
      totalMonthlyPayment,
    };
  }, [inputs]);
};

/**
 * Hook to generate amortization schedules
 */
export const useAmortizationSchedules = (inputs: MortgageInputs) => {
  const { loanAmount, monthlyRate, totalPayments, monthlyPI, monthlyPMI, monthlyEscrow } =
    useBasicMetrics(inputs);

  const generateSchedule = useMemo(() => {
    return (extraMonthly = 0, doubleMonthly = false, extraAnnual = 0, biWeekly = false) => {
      const schedule = [];
      let remainingBalance = loanAmount;
      let totalInterestPaid = 0;

      if (biWeekly) {
        // Bi-weekly payments: 26 payments per year = 13 monthly payments
        const biWeeklyPayment = monthlyPI / 2;
        const biWeeklyRate = inputs.interestRate / 100 / BIWEEKLY_PERIODS_PER_YEAR;
        let paymentNumber = 1;
        const maxPayments = Math.min(totalPayments * 2, MAX_ITERATIONS);

        while (remainingBalance > MINIMUM_BALANCE && paymentNumber <= maxPayments) {
          const interestPayment = remainingBalance * biWeeklyRate;
          let principalPayment = biWeeklyPayment - interestPayment;

          // Safety check: prevent negative principal payments
          if (principalPayment <= 0) {
            console.warn('Bi-weekly payment too low to cover interest. Stopping amortization.');
            break;
          }

          // Don't pay more than remaining balance
          principalPayment = Math.min(principalPayment, remainingBalance);

          remainingBalance -= principalPayment;
          totalInterestPaid += interestPayment;

          // Add to schedule every 2 payments (monthly equivalent)
          if (paymentNumber % 2 === 0) {
            const currentLTV = inputs.isExistingLoan
              ? (remainingBalance / inputs.originalPrincipal) * 100
              : (remainingBalance / inputs.homePrice) * 100;
            const pmiPayment = inputs.isExistingLoan
              ? remainingBalance > 0
                ? monthlyPMI
                : 0
              : currentLTV > PMI_LTV_THRESHOLD
              ? monthlyPMI
              : 0;

            schedule.push({
              month: Math.ceil(paymentNumber / 2),
              payment: biWeeklyPayment * 2,
              principal: principalPayment * 2,
              interest: interestPayment * 2,
              extraPrincipal: 0,
              balance: remainingBalance,
              totalInterest: totalInterestPaid,
              pmi: pmiPayment,
              escrow: monthlyEscrow,
            });
          }

          paymentNumber++;
        }
      } else {
        // Standard monthly payments
        const maxMonths = Math.min(totalPayments, MAX_ITERATIONS);
        for (let month = 1; month <= maxMonths && remainingBalance > MINIMUM_BALANCE; month++) {
          const interestPayment = remainingBalance * monthlyRate;
          let principalPayment = monthlyPI - interestPayment;

          // Safety check: prevent negative principal payments
          if (principalPayment <= 0) {
            console.warn('Monthly payment too low to cover interest. Stopping amortization.');
            break;
          }

          // Add extra payments
          let extraPrincipal = extraMonthly;
          if (doubleMonthly) {
            extraPrincipal += principalPayment;
          }
          if (month % 12 === 0) {
            extraPrincipal += extraAnnual;
          }

          // Don't pay more than remaining balance
          const totalPrincipal = Math.min(principalPayment + extraPrincipal, remainingBalance);

          remainingBalance -= totalPrincipal;
          totalInterestPaid += interestPayment;

          const currentLTV = inputs.isExistingLoan
            ? (remainingBalance / inputs.originalPrincipal) * 100
            : (remainingBalance / inputs.homePrice) * 100;
          const pmiPayment = inputs.isExistingLoan
            ? remainingBalance > 0
              ? monthlyPMI
              : 0
            : currentLTV > PMI_LTV_THRESHOLD
            ? monthlyPMI
            : 0;

          schedule.push({
            month,
            payment: monthlyPI + extraPrincipal,
            principal: totalPrincipal,
            interest: interestPayment,
            extraPrincipal,
            balance: remainingBalance,
            totalInterest: totalInterestPaid,
            pmi: pmiPayment,
            escrow: monthlyEscrow,
          });
        }
      }

      return schedule;
    };
  }, [inputs, loanAmount, monthlyRate, totalPayments, monthlyPI, monthlyPMI, monthlyEscrow]);

  const standardSchedule = useMemo(() => generateSchedule(), [generateSchedule]);

  const paydownSchedule = useMemo(
    () =>
      generateSchedule(
        inputs.extraMonthlyPrincipal,
        inputs.doubleMonthlyPrincipal,
        inputs.extraAnnualPayment,
        inputs.biWeeklyPayments
      ),
    [generateSchedule, inputs]
  );

  return {
    standardSchedule,
    paydownSchedule,
    generateSchedule,
  };
};

/**
 * Hook for points calculator comparisons
 */
export const usePointsComparison = (
  scenarios: PointsScenario[],
  loanAmount: number,
  termYears: number
) => {
  return useMemo(() => {
    const baseline = scenarios.find((s) => s.isBaseline);
    if (!baseline) return [];

    const results = scenarios.map((scenario) => {
      const monthlyRate = scenario.rate / 100 / 12;
      const totalPayments = termYears * 12;

      // Calculate monthly P&I
      const monthlyPI =
        monthlyRate === 0
          ? loanAmount / totalPayments
          : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
            (Math.pow(1 + monthlyRate, totalPayments) - 1);

      // Calculate point cost
      const pointCost = loanAmount * (scenario.points / 100);

      // Calculate total interest over the full term
      const totalInterest = monthlyPI * totalPayments - loanAmount;

      // Calculate total cost (principal + interest + points)
      const totalCost = loanAmount + totalInterest + pointCost;

      // Calculate break-even months vs baseline
      let breakEvenMonths: number | null = null;
      if (scenario.id !== baseline.id) {
        const baselineMonthlyRate = baseline.rate / 100 / 12;
        const baselineMonthlyPI =
          baselineMonthlyRate === 0
            ? loanAmount / totalPayments
            : (loanAmount * (baselineMonthlyRate * Math.pow(1 + baselineMonthlyRate, totalPayments))) /
              (Math.pow(1 + baselineMonthlyRate, totalPayments) - 1);

        const monthlySavings = baselineMonthlyPI - monthlyPI;
        if (monthlySavings > 0 && pointCost > 0) {
          breakEvenMonths = Math.ceil(pointCost / monthlySavings);
        }
      }

      return {
        scenario,
        monthlyPI,
        pointCost,
        totalInterest,
        totalCost,
        breakEvenMonths,
        monthlySavings: scenario.id !== baseline.id ? monthlyPI : 0,
      };
    });

    return results;
  }, [scenarios, loanAmount, termYears]);
};
