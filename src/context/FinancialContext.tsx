import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Category,
  CategoryBudget,
  DataQualityIssue,
  Holiday,
  MonthlyBudget,
  MonthlyFinancialSummary,
  SavingsGoal,
  Transaction,
  User,
} from '../types';
import { StorageService } from '../services/storageService';
import { calculateMonthlySummary } from '../utils/financialCalculations';
import { runDataQualityAudit } from '../services/dataQualityService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface FinancialContextType {
  user: User;
  year: number;
  monthNumber: number;
  setYear: (y: number) => void;
  setMonthNumber: (m: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  budgets: MonthlyBudget[];
  currentBudget: MonthlyBudget | undefined;
  saveBudget: (budget: Omit<MonthlyBudget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  copyYearBudgets: (fromYear: number, toYear: number, overwrite?: boolean) => void;

  transactions: Transaction[];
  monthTransactions: Transaction[];
  saveTransaction: (tx: Partial<Transaction> & { transactionDate: string; agendaTitle: string; transactionType: any }) => boolean;
  deleteTransaction: (id: string) => void;

  categories: Category[];
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;

  holidays: Holiday[];
  saveHoliday: (h: Holiday) => void;
  deleteHoliday: (id: string) => void;

  savingsGoals: SavingsGoal[];
  saveSavingsGoal: (g: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;

  categoryBudgets: CategoryBudget[];
  saveCategoryBudget: (cb: CategoryBudget) => void;

  summary: MonthlyFinancialSummary;
  issues: DataQualityIssue[];

  // Modals & UI helpers
  isTxModalOpen: boolean;
  editingTx: Partial<Transaction> | null;
  openTxModal: (tx?: Partial<Transaction>) => void;
  closeTxModal: () => void;

  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Demo & Reset
  loadDemoData: () => void;
  removeDemoData: () => void;
  clearAllData: () => void;
  refreshData: () => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local current date default (October 2026 based on metadata)
  const now = new Date();
  const [year, setYearState] = useState<number>(() => {
    return now.getFullYear() === 2026 ? 2026 : now.getFullYear();
  });
  const [monthNumber, setMonthNumberState] = useState<number>(() => {
    return now.getMonth() + 1; // 1-12
  });
  const [activeTab, setActiveTab] = useState<string>('home');

  const [user, setUser] = useState<User>(() => StorageService.getUser());
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  // Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<Transaction> | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(() => {
    StorageService.initialize();
    setUser(StorageService.getUser());
    setBudgets(StorageService.getMonthlyBudgets());
    setTransactions(StorageService.getTransactions());
    setCategories(StorageService.getCategories());
    setHolidays(StorageService.getHolidays());
    setSavingsGoals(StorageService.getSavingsGoals());
    setCategoryBudgets(StorageService.getCategoryBudgets());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setYear = useCallback((newYear: number) => {
    setYearState(newYear);
  }, []);

  const setMonthNumber = useCallback((newMonth: number) => {
    setMonthNumberState(newMonth);
  }, []);

  // Isolate current monthly budget strictly by active user + active year + active monthNumber
  const currentBudget = useMemo(() => {
    return budgets.find(b => b.year === year && b.monthNumber === monthNumber);
  }, [budgets, year, monthNumber]);

  // Filter transactions for active year and month
  const monthTransactions = useMemo(() => {
    const prefix = `${year}-${String(monthNumber).padStart(2, '0')}`;
    return transactions.filter(t => t.transactionDate.startsWith(prefix));
  }, [transactions, year, monthNumber]);

  // Recalculate summary immediately
  const summary = useMemo(() => {
    const initialBudget = currentBudget ? currentBudget.initialBudget : 0;
    return calculateMonthlySummary(year, monthNumber, initialBudget, transactions);
  }, [year, monthNumber, currentBudget, transactions]);

  // Recalculate data quality audit
  const issues = useMemo(() => {
    return runDataQualityAudit(summary, budgets, monthTransactions, categories, holidays);
  }, [summary, budgets, monthTransactions, categories, holidays]);

  // Actions
  const saveBudget = useCallback((budgetData: Omit<MonthlyBudget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const res = StorageService.saveMonthlyBudget(budgetData);
    if (res.success) {
      setBudgets(StorageService.getMonthlyBudgets());
      addToast('Budget bulanan berhasil disimpan!', 'success');
    } else {
      addToast(res.error || 'Gagal menyimpan budget', 'error');
    }
  }, [addToast]);

  const copyYearBudgets = useCallback((fromYear: number, toYear: number, overwrite: boolean = false) => {
    const res = StorageService.copyBudgetsToYear(fromYear, toYear, overwrite);
    setBudgets(StorageService.getMonthlyBudgets());
    addToast(`${res.copiedCount} alokasi budget berhasil disalin ke tahun ${toYear}!`, 'success');
  }, [addToast]);

  const saveTransaction = useCallback((txData: Partial<Transaction> & { transactionDate: string; agendaTitle: string; transactionType: any }) => {
    const res = StorageService.saveTransaction(txData);
    if (res.success) {
      setTransactions(StorageService.getTransactions());
      addToast(txData.id ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil ditambahkan!', 'success');
      return true;
    } else {
      addToast(res.error || 'Gagal menyimpan transaksi', 'error');
      return false;
    }
  }, [addToast]);

  const deleteTransaction = useCallback((id: string) => {
    const success = StorageService.deleteTransaction(id);
    if (success) {
      setTransactions(StorageService.getTransactions());
      addToast('Transaksi berhasil dihapus.', 'info');
    }
  }, [addToast]);

  const saveCategory = useCallback((cat: Category) => {
    StorageService.saveCategory(cat);
    setCategories(StorageService.getCategories());
    addToast('Kategori berhasil disimpan!', 'success');
  }, [addToast]);

  const deleteCategory = useCallback((id: string) => {
    StorageService.deleteCategory(id);
    setCategories(StorageService.getCategories());
    addToast('Kategori berhasil dihapus.', 'info');
  }, [addToast]);

  const saveHoliday = useCallback((h: Holiday) => {
    StorageService.saveHoliday(h);
    setHolidays(StorageService.getHolidays());
    addToast('Hari libur berhasil disimpan!', 'success');
  }, [addToast]);

  const deleteHoliday = useCallback((id: string) => {
    StorageService.deleteHoliday(id);
    setHolidays(StorageService.getHolidays());
    addToast('Hari libur berhasil dihapus.', 'info');
  }, [addToast]);

  const saveSavingsGoal = useCallback((g: SavingsGoal) => {
    StorageService.saveSavingsGoal(g);
    setSavingsGoals(StorageService.getSavingsGoals());
    addToast('Target tabungan berhasil disimpan!', 'success');
  }, [addToast]);

  const deleteSavingsGoal = useCallback((id: string) => {
    StorageService.deleteSavingsGoal(id);
    setSavingsGoals(StorageService.getSavingsGoals());
    addToast('Target tabungan dihapus.', 'info');
  }, [addToast]);

  const saveCategoryBudget = useCallback((cb: CategoryBudget) => {
    StorageService.saveCategoryBudget(cb);
    setCategoryBudgets(StorageService.getCategoryBudgets());
    addToast('Batas budget kategori disimpan!', 'success');
  }, [addToast]);

  const openTxModal = useCallback((tx?: Partial<Transaction>) => {
    setEditingTx(tx || null);
    setIsTxModalOpen(true);
  }, []);

  const closeTxModal = useCallback(() => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  }, []);

  const loadDemoData = useCallback(() => {
    StorageService.loadDemoData(year, monthNumber);
    refreshData();
    addToast('Data percontohan (Demo Data) berhasil dimuat!', 'success');
  }, [year, monthNumber, refreshData, addToast]);

  const removeDemoData = useCallback(() => {
    StorageService.removeDemoData();
    refreshData();
    addToast('Data percontohan berhasil dibersihkan!', 'info');
  }, [refreshData, addToast]);

  const clearAllData = useCallback(() => {
    StorageService.clearAllData();
    refreshData();
    addToast('Semua data berhasil direset.', 'warning');
  }, [refreshData, addToast]);

  const value = {
    user,
    year,
    monthNumber,
    setYear,
    setMonthNumber,
    activeTab,
    setActiveTab,
    budgets,
    currentBudget,
    saveBudget,
    copyYearBudgets,
    transactions,
    monthTransactions,
    saveTransaction,
    deleteTransaction,
    categories,
    saveCategory,
    deleteCategory,
    holidays,
    saveHoliday,
    deleteHoliday,
    savingsGoals,
    saveSavingsGoal,
    deleteSavingsGoal,
    categoryBudgets,
    saveCategoryBudget,
    summary,
    issues,
    isTxModalOpen,
    editingTx,
    openTxModal,
    closeTxModal,
    toasts,
    addToast,
    removeToast,
    loadDemoData,
    removeDemoData,
    clearAllData,
    refreshData,
  };

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};

export const useFinancialData = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
};
