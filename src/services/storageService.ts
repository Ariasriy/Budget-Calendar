/**
 * Storage & Repository Service
 * Provides persistent storage and prepared data access layer.
 */

import {
  Category,
  CategoryBudget,
  Holiday,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
  User,
} from '../types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_HOLIDAYS,
  DEMO_USER_ID,
} from './defaultData';
import { calculateTransactionMetrics } from '../utils/financialCalculations';
import { INDONESIAN_MONTHS } from '../utils/formatters';

const STORAGE_KEYS = {
  USER: 'bcm_active_user',
  BUDGETS: 'bcm_monthly_budgets_v1',
  TRANSACTIONS: 'bcm_transactions_v1',
  CATEGORIES: 'bcm_categories_v1',
  HOLIDAYS: 'bcm_holidays_v1',
  SAVINGS_GOALS: 'bcm_savings_goals_v1',
  CATEGORY_BUDGETS: 'bcm_category_budgets_v1',
  HAS_INITIALIZED: 'bcm_has_initialized_v1',
};

export class StorageService {
  private static currentUser: User = {
    id: DEMO_USER_ID,
    displayName: 'Keuangan Pribadi & Bisnis',
    email: 'ari.asriyanto@student.unri.ac.id',
    role: 'Admin',
    preferredCurrency: 'IDR',
    locale: 'id-ID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  public static initialize(): void {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED);
    if (!initialized) {
      // Setup initial categories and holidays
      const existingCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!existingCats) {
        const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(allCats));
      }

      const existingHolidays = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      if (!existingHolidays) {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(DEFAULT_HOLIDAYS));
      }

      // Initialize empty budgets & transactions unless demo data is chosen
      if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      }

      localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
    }
  }

  // --- USER ---
  public static getUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse user', e);
    }
    return this.currentUser;
  }

  public static saveUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // --- MONTHLY BUDGETS ---
  public static getMonthlyBudgets(userId: string = DEMO_USER_ID): MonthlyBudget[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!raw) return [];
      const all: MonthlyBudget[] = JSON.parse(raw);
      return all.filter(b => b.userId === userId);
    } catch {
      return [];
    }
  }

  public static getBudgetForMonth(
    year: number,
    monthNumber: number,
    userId: string = DEMO_USER_ID
  ): MonthlyBudget | undefined {
    const all = this.getMonthlyBudgets(userId);
    return all.find(b => b.year === year && b.monthNumber === monthNumber);
  }

  public static saveMonthlyBudget(budget: Omit<MonthlyBudget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): { success: boolean; budget?: MonthlyBudget; error?: string } {
    if (budget.initialBudget < 0) {
      return { success: false, error: 'Budget awal tidak boleh bernilai negatif.' };
    }
    if (budget.monthNumber < 1 || budget.monthNumber > 12) {
      return { success: false, error: 'Bulan harus antara 1 sampai 12.' };
    }

    const all = this.getMonthlyBudgets(budget.userId || DEMO_USER_ID);
    const existingIndex = all.findIndex(
      b => b.year === budget.year && b.monthNumber === budget.monthNumber && (budget.id ? b.id !== budget.id : true)
    );

    // If another entry already exists for this user, year, month
    if (existingIndex !== -1 && !budget.id) {
      // Update the existing one instead of creating duplicate
      const target = all[existingIndex];
      target.initialBudget = budget.initialBudget;
      target.notes = budget.notes || target.notes;
      target.updatedAt = new Date().toISOString();
      this.persistBudgets(all);
      return { success: true, budget: target };
    }

    const now = new Date().toISOString();
    let savedBudget: MonthlyBudget;

    if (budget.id) {
      const index = all.findIndex(b => b.id === budget.id);
      if (index !== -1) {
        savedBudget = {
          ...all[index],
          ...budget,
          monthName: INDONESIAN_MONTHS[budget.monthNumber - 1],
          updatedAt: now,
        };
        all[index] = savedBudget;
      } else {
        savedBudget = {
          id: budget.id,
          userId: budget.userId || DEMO_USER_ID,
          year: budget.year,
          monthNumber: budget.monthNumber,
          monthName: INDONESIAN_MONTHS[budget.monthNumber - 1],
          initialBudget: budget.initialBudget,
          notes: budget.notes,
          createdAt: now,
          updatedAt: now,
        };
        all.push(savedBudget);
      }
    } else {
      savedBudget = {
        id: `mb-${budget.year}-${budget.monthNumber}-${Date.now()}`,
        userId: budget.userId || DEMO_USER_ID,
        year: budget.year,
        monthNumber: budget.monthNumber,
        monthName: INDONESIAN_MONTHS[budget.monthNumber - 1],
        initialBudget: budget.initialBudget,
        notes: budget.notes,
        createdAt: now,
        updatedAt: now,
      };
      all.push(savedBudget);
    }

    this.persistBudgets(all);
    return { success: true, budget: savedBudget };
  }

  public static copyBudgetsToYear(fromYear: number, toYear: number, overwrite: boolean = false, userId: string = DEMO_USER_ID): { copiedCount: number } {
    const all = this.getMonthlyBudgets(userId);
    const sourceBudgets = all.filter(b => b.year === fromYear);
    let copiedCount = 0;

    sourceBudgets.forEach(src => {
      const existing = all.find(b => b.year === toYear && b.monthNumber === src.monthNumber);
      if (existing) {
        if (overwrite) {
          existing.initialBudget = src.initialBudget;
          existing.notes = `Disalin dari ${fromYear}: ${src.notes || ''}`.trim();
          existing.updatedAt = new Date().toISOString();
          copiedCount++;
        }
      } else {
        all.push({
          id: `mb-${toYear}-${src.monthNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId,
          year: toYear,
          monthNumber: src.monthNumber,
          monthName: src.monthName,
          initialBudget: src.initialBudget,
          notes: `Disalin dari tahun ${fromYear}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        copiedCount++;
      }
    });

    this.persistBudgets(all);
    return { copiedCount };
  }

  private static persistBudgets(budgets: MonthlyBudget[]): void {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }

  // --- TRANSACTIONS ---
  public static getTransactions(userId: string = DEMO_USER_ID): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!raw) return [];
      const all: Transaction[] = JSON.parse(raw);
      return all.filter(t => t.userId === userId);
    } catch {
      return [];
    }
  }

  public static saveTransaction(txData: Partial<Transaction> & { transactionDate: string; agendaTitle: string; transactionType: any; plannedAmount?: number; actualAmount?: number }): { success: boolean; transaction?: Transaction; error?: string } {
    // Validations
    if (!txData.transactionDate) {
      return { success: false, error: 'Tanggal transaksi wajib diisi.' };
    }
    if (!txData.agendaTitle || txData.agendaTitle.trim() === '') {
      return { success: false, error: 'Judul agenda wajib diisi.' };
    }
    if (!txData.transactionType || !['Pengeluaran', 'Pemasukan'].includes(txData.transactionType)) {
      return { success: false, error: 'Tipe transaksi harus Pengeluaran atau Pemasukan.' };
    }
    if ((txData.plannedAmount ?? 0) < 0) {
      return { success: false, error: 'Nilai rencana tidak boleh bernilai negatif.' };
    }
    if ((txData.actualAmount ?? 0) < 0) {
      return { success: false, error: 'Nilai aktual tidak boleh bernilai negatif.' };
    }

    const planned = Math.max(0, txData.plannedAmount || 0);
    const actual = Math.max(0, txData.actualAmount || 0);
    const metrics = calculateTransactionMetrics(txData.transactionType, planned, actual);

    const now = new Date().toISOString();
    const all = this.getTransactions(txData.userId || DEMO_USER_ID);

    let savedTx: Transaction;

    if (txData.id) {
      const index = all.findIndex(t => t.id === txData.id);
      if (index !== -1) {
        savedTx = {
          ...all[index],
          ...txData,
          plannedAmount: planned,
          actualAmount: actual,
          varianceAmount: metrics.varianceAmount,
          realizationPercentage: metrics.realizationPercentage,
          status: metrics.status,
          updatedAt: now,
        } as Transaction;
        all[index] = savedTx;
      } else {
        savedTx = {
          id: txData.id,
          userId: txData.userId || DEMO_USER_ID,
          transactionDate: txData.transactionDate,
          transactionType: txData.transactionType,
          agendaTitle: txData.agendaTitle.trim(),
          category: txData.category || 'Lainnya',
          personInCharge: txData.personInCharge || '',
          plannedAmount: planned,
          actualAmount: actual,
          varianceAmount: metrics.varianceAmount,
          realizationPercentage: metrics.realizationPercentage,
          status: metrics.status,
          notes: txData.notes || '',
          referenceNumber: txData.referenceNumber || '',
          paymentStatus: txData.paymentStatus || (txData.actualAmount && txData.actualAmount > 0 ? 'Paid' : 'Planned'),
          isRecurring: !!txData.isRecurring,
          recurrenceFrequency: txData.recurrenceFrequency || 'none',
          attachments: txData.attachments || [],
          createdAt: now,
          updatedAt: now,
        };
        all.push(savedTx);
      }
    } else {
      savedTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: txData.userId || DEMO_USER_ID,
        transactionDate: txData.transactionDate,
        transactionType: txData.transactionType,
        agendaTitle: txData.agendaTitle.trim(),
        category: txData.category || (txData.transactionType === 'Pengeluaran' ? 'Lainnya' : 'Pendapatan Lain'),
        personInCharge: txData.personInCharge || '',
        plannedAmount: planned,
        actualAmount: actual,
        varianceAmount: metrics.varianceAmount,
        realizationPercentage: metrics.realizationPercentage,
        status: metrics.status,
        notes: txData.notes || '',
        referenceNumber: txData.referenceNumber || '',
        paymentStatus: txData.paymentStatus || (actual > 0 ? 'Paid' : 'Planned'),
        isRecurring: !!txData.isRecurring,
        recurrenceFrequency: txData.recurrenceFrequency || 'none',
        attachments: txData.attachments || [],
        createdAt: now,
        updatedAt: now,
      };
      all.push(savedTx);
    }

    this.persistTransactions(all);
    return { success: true, transaction: savedTx };
  }

  public static deleteTransaction(id: string, userId: string = DEMO_USER_ID): boolean {
    const all = this.getTransactions(userId);
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length !== all.length) {
      this.persistTransactions(filtered);
      return true;
    }
    return false;
  }

  public static batchSaveTransactions(txs: Transaction[]): void {
    const existing = this.getTransactions();
    const map = new Map<string, Transaction>();
    existing.forEach(t => map.set(t.id, t));
    txs.forEach(t => map.set(t.id, t));
    this.persistTransactions(Array.from(map.values()));
  }

  private static persistTransactions(txs: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  // --- CATEGORIES ---
  public static getCategories(): Category[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    }
  }

  public static saveCategory(category: Category): void {
    const all = this.getCategories();
    const index = all.findIndex(c => c.id === category.id);
    if (index !== -1) {
      all[index] = category;
    } else {
      all.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(all));
  }

  public static deleteCategory(id: string): void {
    const all = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(all));
  }

  // --- HOLIDAYS ---
  public static getHolidays(): Holiday[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      if (!raw) return DEFAULT_HOLIDAYS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_HOLIDAYS;
    }
  }

  public static saveHoliday(holiday: Holiday): void {
    const all = this.getHolidays();
    const index = all.findIndex(h => h.id === holiday.id);
    if (index !== -1) {
      all[index] = holiday;
    } else {
      all.push(holiday);
    }
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(all));
  }

  public static deleteHoliday(id: string): void {
    const all = this.getHolidays().filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(all));
  }

  // --- SAVINGS GOALS ---
  public static getSavingsGoals(userId: string = DEMO_USER_ID): SavingsGoal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
      if (!raw) return [];
      return JSON.parse(raw).filter((g: SavingsGoal) => g.userId === userId);
    } catch {
      return [];
    }
  }

  public static saveSavingsGoal(goal: SavingsGoal): void {
    const all = this.getSavingsGoals(goal.userId || DEMO_USER_ID);
    const index = all.findIndex(g => g.id === goal.id);
    if (index !== -1) {
      all[index] = goal;
    } else {
      all.push(goal);
    }
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(all));
  }

  public static deleteSavingsGoal(id: string, userId: string = DEMO_USER_ID): void {
    const all = this.getSavingsGoals(userId).filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(all));
  }

  // --- CATEGORY BUDGETS ---
  public static getCategoryBudgets(userId: string = DEMO_USER_ID): CategoryBudget[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
      if (!raw) return [];
      return JSON.parse(raw).filter((cb: CategoryBudget) => cb.userId === userId);
    } catch {
      return [];
    }
  }

  public static saveCategoryBudget(catBudget: CategoryBudget): void {
    const all = this.getCategoryBudgets(catBudget.userId);
    const index = all.findIndex(
      cb => cb.year === catBudget.year && cb.monthNumber === catBudget.monthNumber && cb.categoryName === catBudget.categoryName
    );
    if (index !== -1) {
      all[index] = catBudget;
    } else {
      all.push(catBudget);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(all));
  }

  // --- BACKUP & RESTORE ---
  public static exportAllData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      budgets: this.getMonthlyBudgets(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      holidays: this.getHolidays(),
      savingsGoals: this.getSavingsGoals(),
      categoryBudgets: this.getCategoryBudgets(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public static importAllData(jsonStr: string): { success: boolean; message: string; count?: { budgets: number; transactions: number } } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.budgets && !data.transactions) {
        return { success: false, message: 'Format data JSON tidak valid: tidak ditemukan array budgets atau transactions.' };
      }

      if (Array.isArray(data.budgets)) {
        this.persistBudgets(data.budgets);
      }
      if (Array.isArray(data.transactions)) {
        this.persistTransactions(data.transactions);
      }
      if (Array.isArray(data.categories)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      }
      if (Array.isArray(data.holidays)) {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data.holidays));
      }
      if (Array.isArray(data.savingsGoals)) {
        localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(data.savingsGoals));
      }

      return {
        success: true,
        message: 'Data berhasil dipulihkan dari backup JSON!',
        count: {
          budgets: data.budgets?.length || 0,
          transactions: data.transactions?.length || 0,
        },
      };
    } catch (e: any) {
      return { success: false, message: `Gagal memproses file: ${e.message}` };
    }
  }

  public static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORY_BUDGETS);
  }

  // --- OPTIONAL DEMO DATA (Cleanly Marked & Removable) ---
  public static loadDemoData(year: number = 2026, monthNumber: number = 10): void {
    const userId = DEMO_USER_ID;
    const now = new Date().toISOString();

    // 1. Budget Awal
    this.saveMonthlyBudget({
      userId,
      year,
      monthNumber,
      monthName: INDONESIAN_MONTHS[monthNumber - 1],
      initialBudget: 15_000_000, // Rp 15 Juta
      notes: '[DEMO DATA] Alokasi operasional & rumah tangga bulan ini',
    });

    // Also a different budget for next year (to test multi-year isolation)
    this.saveMonthlyBudget({
      userId,
      year: year + 1,
      monthNumber,
      monthName: INDONESIAN_MONTHS[monthNumber - 1],
      initialBudget: 18_500_000,
      notes: '[DEMO DATA] Target budget tahun berikutnya',
    });

    const mStr = String(monthNumber).padStart(2, '0');

    // Demo transactions
    const demoTxs: Partial<Transaction>[] = [
      // Income
      {
        transactionDate: `${year}-${mStr}-01`,
        transactionType: 'Pemasukan',
        agendaTitle: '[DEMO] Gaji Pokok Bulanan',
        category: 'Gaji',
        personInCharge: 'Finance Dept',
        plannedAmount: 12_000_000,
        actualAmount: 12_000_000,
        notes: 'Gaji payroll transfer otomatis',
        paymentStatus: 'Paid',
      },
      {
        transactionDate: `${year}-${mStr}-15`,
        transactionType: 'Pemasukan',
        agendaTitle: '[DEMO] Bonus Performa Kuartal',
        category: 'Bonus',
        personInCharge: 'Manajemen',
        plannedAmount: 2_000_000,
        actualAmount: 2_500_000,
        notes: 'Bonus insentif project',
        paymentStatus: 'Paid',
      },

      // Expense 1: Multiple agendas on the same date! (Demonstrating item 5 & 6)
      {
        transactionDate: `${year}-${mStr}-05`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Tagihan Listrik PLN & Internet Kantor',
        category: 'Tagihan',
        personInCharge: 'Budi (Admin)',
        plannedAmount: 1_200_000,
        actualAmount: 1_150_000,
        notes: 'Listrik pascabayar & wifi fiber optik',
        paymentStatus: 'Paid',
      },
      {
        transactionDate: `${year}-${mStr}-05`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Pasokan Kopi & Snack Pantry',
        category: 'Operasional',
        personInCharge: 'Siti',
        plannedAmount: 350_000,
        actualAmount: 350_000,
        notes: 'Belanja bulanan pantry kantor',
        paymentStatus: 'Paid',
      },
      {
        transactionDate: `${year}-${mStr}-05`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Langganan Cloud Storage & Domain',
        category: 'Tagihan',
        personInCharge: 'Ari',
        plannedAmount: 400_000,
        actualAmount: 400_000,
        notes: 'Perpanjangan layanan hosting bulanan',
        paymentStatus: 'Paid',
      },

      // Expense 2: On/Under budget
      {
        transactionDate: `${year}-${mStr}-08`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Servis Rutin Kendaraan Operasional',
        category: 'Maintenance',
        personInCharge: 'Rian (Driver)',
        plannedAmount: 1_000_000,
        actualAmount: 800_000,
        notes: 'Ganti oli & tune-up (lebih hemat Rp 200rb)',
        paymentStatus: 'Paid',
      },

      // Expense 3: Over Budget example
      {
        transactionDate: `${year}-${mStr}-12`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Perjalanan Dinas Jakarta - Bandung',
        category: 'Perjalanan',
        personInCharge: 'Ari Asriyanto',
        plannedAmount: 1_000_000,
        actualAmount: 1_200_000,
        notes: 'Tiket kereta Whoosh & taksi lokal (Over budget Rp 200rb)',
        paymentStatus: 'Paid',
      },

      // Expense 4: Planned but not yet paid (Belum Aktual)
      {
        transactionDate: `${year}-${mStr}-20`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Cicilan Laptop Kerja Tahap 6',
        category: 'Cicilan',
        personInCharge: 'Finance',
        plannedAmount: 2_500_000,
        actualAmount: 0,
        notes: 'Jatuh tempo tanggal 20',
        paymentStatus: 'Due',
      },
      {
        transactionDate: `${year}-${mStr}-25`,
        transactionType: 'Pengeluaran',
        agendaTitle: '[DEMO] Jamuan Makan Siang Klien VIP',
        category: 'Makanan',
        personInCharge: 'Ari',
        plannedAmount: 750_000,
        actualAmount: 0,
        notes: 'Estimasi reservasi restoran',
        paymentStatus: 'Planned',
      },
    ];

    demoTxs.forEach(t => this.saveTransaction(t as any));

    // Demo Savings Goal
    this.saveSavingsGoal({
      id: 'sg-demo-1',
      userId,
      goalName: '[DEMO] Dana Darurat 6 Bulan',
      targetAmount: 50_000_000,
      currentAmount: 28_000_000,
      targetDate: `${year + 1}-12-31`,
      monthlyContribution: 2_000_000,
      status: 'In Progress',
      createdAt: now,
      updatedAt: now,
    });
  }

  public static removeDemoData(): void {
    const budgets = this.getMonthlyBudgets().filter(b => !b.notes?.includes('[DEMO'));
    const txs = this.getTransactions().filter(t => !t.agendaTitle.includes('[DEMO'));
    const goals = this.getSavingsGoals().filter(g => !g.goalName.includes('[DEMO'));

    this.persistBudgets(budgets);
    this.persistTransactions(txs);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
  }
}
