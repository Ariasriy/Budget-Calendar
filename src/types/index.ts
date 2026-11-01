/**
 * Types & Data Entities for Budget Calendar & Cashflow Monitoring
 * Conforms to Kalender_Monitoring_Budget specifications
 */

export type UserRole = 'User' | 'Admin';

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  preferredCurrency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  year: number;
  monthNumber: number; // 1 - 12
  monthName: string;
  initialBudget: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'Pengeluaran' | 'Pemasukan';

export type PaymentStatus = 
  | 'Planned' 
  | 'Due' 
  | 'Paid' 
  | 'Partially Paid' 
  | 'Cancelled' 
  | 'Rescheduled';

export type RecurrenceFrequency = 
  | 'none'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export interface Attachment {
  id: string;
  transactionId?: string;
  fileName: string;
  fileType: string;
  fileUrl: string; // Base64 data URL for client storage
  fileSize?: number;
  uploadedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  transactionDate: string; // YYYY-MM-DD
  transactionType: TransactionType;
  agendaTitle: string;
  category: string;
  personInCharge: string; // PIC
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number; // For expense: plan - actual; for income: actual - plan
  realizationPercentage: number; // actual / plan
  status: string; // "Belum Aktual" | "On/Under Budget" | "Over Budget" | "Belum Diterima" | "Diterima"
  notes?: string;
  referenceNumber?: string;
  paymentStatus: PaymentStatus;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export type HolidayType = 
  | 'Libur Nasional' 
  | 'Cuti Bersama' 
  | 'Libur Perusahaan' 
  | 'Hari Kerja Pengganti';

export interface Holiday {
  id: string;
  holidayDate: string; // YYYY-MM-DD
  holidayType: HolidayType;
  holidayName: string;
  description?: string;
  year: number;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  categoryName: string;
  transactionType: TransactionType;
  color: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  year: number;
  monthNumber: number;
  categoryName: string;
  budgetLimit: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  status: 'In Progress' | 'Achieved' | 'On Hold';
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  theme: 'dark' | 'light';
  defaultCurrency: string;
  locale: string;
  notifyDueDays: number;
  overBudgetAlertThreshold: number; // percentage (e.g. 100%)
  enableDemoData: boolean;
}

// Financial status enum according to specification Section C
export type MonthlyFinancialStatus =
  | 'BELUM ADA DANA'
  | 'PLAN MELEBIHI DANA'
  | 'AKTUAL MELEBIHI DANA'
  | 'AKTUAL > PLAN'
  | 'TERKENDALI';

export interface MonthlyFinancialSummary {
  year: number;
  monthNumber: number;
  initialMonthlyBudget: number;
  actualIncome: number; // Money In
  availableFunds: number; // Budget Awal + Money In
  plannedExpense: number;
  actualExpense: number;
  actualRemainingFunds: number; // Available Funds - Actual Expense
  remainingFundsAfterPlan: number; // Available Funds - Planned Expense
  planVsActualVariance: number; // Planned Expense - Actual Expense
  budgetUtilization: number; // Actual Expense / Available Funds (0 if availableFunds == 0)
  status: MonthlyFinancialStatus;
  expenseTransactionCount: number;
  incomeTransactionCount: number;
}

export type IssueSeverity = 'Info' | 'Warning' | 'Critical';

export interface DataQualityIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedCount: number;
  recommendedAction: string;
  affectedRecordIds?: string[];
  linkTab?: string;
}
