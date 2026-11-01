/**
 * Financial Calculation Engine
 * Strict implementation of Workbook Rules (Sections B & C)
 */

import {
  MonthlyFinancialStatus,
  MonthlyFinancialSummary,
  Transaction,
  TransactionType,
} from '../types';

/**
 * 1. Available Funds = Initial Monthly Budget + Actual Money In
 */
export function calculateAvailableFunds(
  initialMonthlyBudget: number,
  actualIncome: number
): number {
  const budget = Math.max(0, initialMonthlyBudget || 0);
  const income = Math.max(0, actualIncome || 0);
  return budget + income;
}

/**
 * 2. Actual Remaining Funds = Available Funds - Actual Expense
 * (Do not subtract planned expenses from actual cash balance!)
 */
export function calculateActualRemainingFunds(
  availableFunds: number,
  actualExpense: number
): number {
  return (availableFunds || 0) - Math.max(0, actualExpense || 0);
}

/**
 * 3. Remaining Funds After Plan = Available Funds - Planned Expense
 */
export function calculateRemainingAfterPlan(
  availableFunds: number,
  plannedExpense: number
): number {
  return (availableFunds || 0) - Math.max(0, plannedExpense || 0);
}

/**
 * 4. Plan vs Actual Variance = Planned Expense - Actual Expense
 */
export function calculatePlanVsActualVariance(
  plannedExpense: number,
  actualExpense: number
): number {
  return Math.max(0, plannedExpense || 0) - Math.max(0, actualExpense || 0);
}

/**
 * 5. Budget Utilization = Actual Expense / Available Funds
 * If available funds is zero, return 0 (never NaN or Infinity)
 */
export function calculateBudgetUtilization(
  actualExpense: number,
  availableFunds: number
): number {
  if (!availableFunds || availableFunds <= 0) {
    return 0;
  }
  return Math.max(0, actualExpense || 0) / availableFunds;
}

/**
 * Calculate transaction status, variance, and realization percentage
 */
export function calculateTransactionMetrics(
  type: TransactionType,
  plannedAmount: number,
  actualAmount: number
): {
  varianceAmount: number;
  realizationPercentage: number;
  status: string;
} {
  const plan = Math.max(0, plannedAmount || 0);
  const actual = Math.max(0, actualAmount || 0);

  if (type === 'Pengeluaran') {
    // For expense transactions:
    // varianceAmount = plannedAmount - actualAmount
    const varianceAmount = plan - actual;
    // realizationPercentage = if plannedAmount is zero, return 0, otherwise actual / plan
    const realizationPercentage = plan === 0 ? 0 : actual / plan;

    let status = 'Belum Aktual';
    if (actual === 0) {
      status = 'Belum Aktual';
    } else if (actual <= plan) {
      status = 'On/Under Budget';
    } else {
      status = 'Over Budget';
    }

    return {
      varianceAmount,
      realizationPercentage,
      status,
    };
  } else {
    // For income transactions:
    // varianceAmount = actualAmount - plannedAmount
    const varianceAmount = actual - plan;
    // realizationPercentage = if plannedAmount is zero, return 0, otherwise actual / plan
    const realizationPercentage = plan === 0 ? (actual > 0 ? 1 : 0) : actual / plan;

    let status = 'Belum Diterima';
    if (actual === 0) {
      status = 'Belum Diterima';
    } else {
      status = 'Diterima';
    }

    return {
      varianceAmount,
      realizationPercentage,
      status,
    };
  }
}

/**
 * Monthly Financial Status Priority (Section C)
 * 1. If available funds equal zero: "BELUM ADA DANA"
 * 2. If planned expense is greater than available funds: "PLAN MELEBIHI DANA"
 * 3. If actual expense is greater than available funds: "AKTUAL MELEBIHI DANA"
 * 4. If actual expense is greater than planned expense: "AKTUAL > PLAN"
 * 5. Otherwise: "TERKENDALI"
 */
export function calculateMonthlyStatus(
  availableFunds: number,
  plannedExpense: number,
  actualExpense: number
): MonthlyFinancialStatus {
  if (availableFunds <= 0) {
    return 'BELUM ADA DANA';
  }
  if (plannedExpense > availableFunds) {
    return 'PLAN MELEBIHI DANA';
  }
  if (actualExpense > availableFunds) {
    return 'AKTUAL MELEBIHI DANA';
  }
  if (actualExpense > plannedExpense) {
    return 'AKTUAL > PLAN';
  }
  return 'TERKENDALI';
}

/**
 * Compute monthly summary aggregates from transactions and initial budget
 */
export function calculateMonthlySummary(
  year: number,
  monthNumber: number,
  initialBudget: number,
  transactions: Transaction[]
): MonthlyFinancialSummary {
  // Filter transactions for specified month and year
  const monthPrefix = `${year}-${String(monthNumber).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.transactionDate.startsWith(monthPrefix));

  let actualIncome = 0;
  let plannedExpense = 0;
  let actualExpense = 0;
  let expenseCount = 0;
  let incomeCount = 0;

  for (const t of monthTransactions) {
    if (t.transactionType === 'Pemasukan') {
      actualIncome += Math.max(0, t.actualAmount || 0);
      incomeCount++;
    } else {
      plannedExpense += Math.max(0, t.plannedAmount || 0);
      actualExpense += Math.max(0, t.actualAmount || 0);
      expenseCount++;
    }
  }

  const initialMonthlyBudget = Math.max(0, initialBudget || 0);
  const availableFunds = calculateAvailableFunds(initialMonthlyBudget, actualIncome);
  const actualRemainingFunds = calculateActualRemainingFunds(availableFunds, actualExpense);
  const remainingFundsAfterPlan = calculateRemainingAfterPlan(availableFunds, plannedExpense);
  const planVsActualVariance = calculatePlanVsActualVariance(plannedExpense, actualExpense);
  const budgetUtilization = calculateBudgetUtilization(actualExpense, availableFunds);
  const status = calculateMonthlyStatus(availableFunds, plannedExpense, actualExpense);

  return {
    year,
    monthNumber,
    initialMonthlyBudget,
    actualIncome,
    availableFunds,
    plannedExpense,
    actualExpense,
    actualRemainingFunds,
    remainingFundsAfterPlan,
    planVsActualVariance,
    budgetUtilization,
    status,
    expenseTransactionCount: expenseCount,
    incomeTransactionCount: incomeCount,
  };
}

export interface DailyBalanceEntry {
  date: string;
  dayNumber: number;
  income: number;
  expense: number;
  plannedExpense: number;
  netDay: number;
  runningBalance: number;
  transactionCount: number;
  agendas: Transaction[];
}

/**
 * 1. Running Daily Balance:
 * dailyBalance = previousDayBalance + actualIncomeForDay - actualExpenseForDay
 */
export function calculateRunningDailyBalances(
  year: number,
  monthNumber: number,
  initialMonthlyBudget: number,
  transactions: Transaction[]
): DailyBalanceEntry[] {
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const monthPrefix = `${year}-${String(monthNumber).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.transactionDate.startsWith(monthPrefix));

  const result: DailyBalanceEntry[] = [];
  let currentBalance = Math.max(0, initialMonthlyBudget || 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const dayTxs = monthTransactions.filter(t => t.transactionDate === dateStr);

    let dayIncome = 0;
    let dayExpense = 0;
    let dayPlannedExpense = 0;

    for (const tx of dayTxs) {
      if (tx.transactionType === 'Pemasukan') {
        dayIncome += Math.max(0, tx.actualAmount || 0);
      } else {
        dayExpense += Math.max(0, tx.actualAmount || 0);
        dayPlannedExpense += Math.max(0, tx.plannedAmount || 0);
      }
    }

    currentBalance = currentBalance + dayIncome - dayExpense;

    result.push({
      date: dateStr,
      dayNumber: day,
      income: dayIncome,
      expense: dayExpense,
      plannedExpense: dayPlannedExpense,
      netDay: dayIncome - dayExpense,
      runningBalance: currentBalance,
      transactionCount: dayTxs.length,
      agendas: dayTxs,
    });
  }

  return result;
}

/**
 * 2. End-of-Month Forecast
 */
export function calculateMonthForecast(
  summary: MonthlyFinancialSummary,
  transactions: Transaction[]
): {
  actualRemainingFunds: number;
  outstandingPlannedExpenses: number;
  expectedIncomeNotReceived: number;
  forecastedEndOfMonthBalance: number;
  isDeficitExpected: boolean;
} {
  const monthPrefix = `${summary.year}-${String(summary.monthNumber).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.transactionDate.startsWith(monthPrefix));

  let outstandingPlannedExpenses = 0;
  let expectedIncomeNotReceived = 0;

  for (const t of monthTransactions) {
    if (t.transactionType === 'Pengeluaran') {
      // If actual is 0 or less than planned, the remainder is still expected to be spent
      const remainingPlan = Math.max(0, (t.plannedAmount || 0) - (t.actualAmount || 0));
      outstandingPlannedExpenses += remainingPlan;
    } else {
      // If planned income is higher than actual received, the remainder is expected incoming
      const remainingExpected = Math.max(0, (t.plannedAmount || 0) - (t.actualAmount || 0));
      expectedIncomeNotReceived += remainingExpected;
    }
  }

  const forecastedEndOfMonthBalance =
    summary.actualRemainingFunds + expectedIncomeNotReceived - outstandingPlannedExpenses;

  return {
    actualRemainingFunds: summary.actualRemainingFunds,
    outstandingPlannedExpenses,
    expectedIncomeNotReceived,
    forecastedEndOfMonthBalance,
    isDeficitExpected: forecastedEndOfMonthBalance < 0,
  };
}
