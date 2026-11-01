import {
  Category,
  DataQualityIssue,
  Holiday,
  MonthlyBudget,
  MonthlyFinancialSummary,
  Transaction,
} from '../types';

export function runDataQualityAudit(
  summary: MonthlyFinancialSummary,
  allBudgets: MonthlyBudget[],
  transactions: Transaction[],
  categories: Category[],
  holidays: Holiday[]
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  // 1. Active monthly budget is not set
  if (!summary.initialMonthlyBudget || summary.initialMonthlyBudget === 0) {
    issues.push({
      id: 'issue-no-budget',
      title: 'Budget Awal Belum Dialokasikan',
      description: `Bulan ${summary.monthNumber} Tahun ${summary.year} belum memiliki budget awal yang ditetapkan.`,
      severity: 'Warning',
      affectedCount: 1,
      recommendedAction: 'Tetapkan Budget Awal di menu Budget atau klik tombol Atur Budget di Home.',
      linkTab: 'budget',
    });
  }

  // 2. Transaction without transaction type
  const missingType = transactions.filter(t => !t.transactionType);
  if (missingType.length > 0) {
    issues.push({
      id: 'issue-missing-type',
      title: 'Transaksi Tanpa Tipe',
      description: `${missingType.length} transaksi tidak memiliki tipe (Pengeluaran/Pemasukan).`,
      severity: 'Critical',
      affectedCount: missingType.length,
      recommendedAction: 'Periksa dan lengkapi tipe transaksi agar perhitungan akurat.',
      affectedRecordIds: missingType.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 3. Transaction without date
  const missingDate = transactions.filter(t => !t.transactionDate || t.transactionDate.trim() === '');
  if (missingDate.length > 0) {
    issues.push({
      id: 'issue-missing-date',
      title: 'Transaksi Tanpa Tanggal',
      description: `${missingDate.length} transaksi belum memiliki tanggal transaksi.`,
      severity: 'Critical',
      affectedCount: missingDate.length,
      recommendedAction: 'Lengkapi tanggal transaksi agar dapat ditampilkan di kalender.',
      affectedRecordIds: missingDate.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 4. Transaction without agenda title
  const missingTitle = transactions.filter(t => !t.agendaTitle || t.agendaTitle.trim() === '');
  if (missingTitle.length > 0) {
    issues.push({
      id: 'issue-missing-title',
      title: 'Transaksi Tanpa Judul Agenda',
      description: `${missingTitle.length} transaksi tidak memiliki nama atau judul agenda.`,
      severity: 'Warning',
      affectedCount: missingTitle.length,
      recommendedAction: 'Beri judul agenda yang deskriptif pada transaksi.',
      affectedRecordIds: missingTitle.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 5. Negative planned amount
  const negPlan = transactions.filter(t => (t.plannedAmount || 0) < 0);
  if (negPlan.length > 0) {
    issues.push({
      id: 'issue-neg-plan',
      title: 'Nilai Plan Negatif Terdeteksi',
      description: `${negPlan.length} transaksi memiliki nilai rencana pengeluaran/pemasukan bertanda negatif.`,
      severity: 'Critical',
      affectedCount: negPlan.length,
      recommendedAction: 'Ubah nilai menjadi positif (>= 0).',
      affectedRecordIds: negPlan.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 6. Negative actual amount
  const negActual = transactions.filter(t => (t.actualAmount || 0) < 0);
  if (negActual.length > 0) {
    issues.push({
      id: 'issue-neg-actual',
      title: 'Nilai Aktual Negatif Terdeteksi',
      description: `${negActual.length} transaksi memiliki nilai aktual bertanda negatif.`,
      severity: 'Critical',
      affectedCount: negActual.length,
      recommendedAction: 'Ubah nilai menjadi positif (>= 0).',
      affectedRecordIds: negActual.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 7. Over-budget transactions
  const overBudgetTxs = transactions.filter(
    t => t.transactionType === 'Pengeluaran' && t.actualAmount > t.plannedAmount && t.plannedAmount > 0
  );
  if (overBudgetTxs.length > 0) {
    issues.push({
      id: 'issue-over-budget-tx',
      title: 'Transaksi Over Budget',
      description: `${overBudgetTxs.length} transaksi pengeluaran melampaui estimasi rencana semula.`,
      severity: 'Warning',
      affectedCount: overBudgetTxs.length,
      recommendedAction: 'Evaluasi pos pengeluaran ini atau sesuaikan alokasi budget Anda.',
      affectedRecordIds: overBudgetTxs.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 8. Duplicate MonthlyBudget year and month
  const budgetKeyMap = new Map<string, number>();
  allBudgets.forEach(b => {
    const key = `${b.userId}_${b.year}_${b.monthNumber}`;
    budgetKeyMap.set(key, (budgetKeyMap.get(key) || 0) + 1);
  });
  const dupBudgetCount = Array.from(budgetKeyMap.values()).filter(c => c > 1).length;
  if (dupBudgetCount > 0) {
    issues.push({
      id: 'issue-dup-budget',
      title: 'Duplikasi Budget Bulanan',
      description: `Ditemukan ${dupBudgetCount} entri budget ganda pada tahun dan bulan yang sama.`,
      severity: 'Critical',
      affectedCount: dupBudgetCount,
      recommendedAction: 'Hapus atau gabungkan budget bulanan yang terduplikasi.',
      linkTab: 'budget',
    });
  }

  // 9. Actual expense above available funds
  if (summary.availableFunds > 0 && summary.actualExpense > summary.availableFunds) {
    issues.push({
      id: 'issue-actual-exceed-funds',
      title: 'Pengeluaran Aktual Melebihi Dana Tersedia',
      description: `Total realisasi pengeluaran melampaui dana tersedia sebesar ${(summary.actualExpense - summary.availableFunds).toLocaleString('id-ID')}.`,
      severity: 'Critical',
      affectedCount: 1,
      recommendedAction: 'Tinjau kembali cashflow dan prioritaskan pengeluaran krusial.',
      linkTab: 'dashboard',
    });
  }

  // 10. Planned expense above available funds
  if (summary.availableFunds > 0 && summary.plannedExpense > summary.availableFunds) {
    issues.push({
      id: 'issue-plan-exceed-funds',
      title: 'Rencana Pengeluaran Melebihi Dana Tersedia',
      description: `Total rencana pengeluaran bulan ini melampaui dana tersedia.`,
      severity: 'Warning',
      affectedCount: 1,
      recommendedAction: 'Kurangi komitmen atau jadwalkan ulang agenda belanja ke bulan berikutnya.',
      linkTab: 'calendar',
    });
  }

  // 11, 12, 13. Invalid / Mismatched Categories
  const expenseCatNames = new Set(
    categories.filter(c => c.transactionType === 'Pengeluaran').map(c => c.categoryName.toLowerCase())
  );
  const incomeCatNames = new Set(
    categories.filter(c => c.transactionType === 'Pemasukan').map(c => c.categoryName.toLowerCase())
  );

  const incomeUsingExpenseCat = transactions.filter(
    t => t.transactionType === 'Pemasukan' && expenseCatNames.has(t.category.toLowerCase()) && !incomeCatNames.has(t.category.toLowerCase())
  );
  if (incomeUsingExpenseCat.length > 0) {
    issues.push({
      id: 'issue-income-exp-cat',
      title: 'Pemasukan Memakai Kategori Pengeluaran',
      description: `${incomeUsingExpenseCat.length} transaksi pemasukan menggunakan nama kategori pengeluaran.`,
      severity: 'Warning',
      affectedCount: incomeUsingExpenseCat.length,
      recommendedAction: 'Sesuaikan kategori transaksi pemasukan dengan pos pemasukan yang sesuai.',
      affectedRecordIds: incomeUsingExpenseCat.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  const expenseUsingIncomeCat = transactions.filter(
    t => t.transactionType === 'Pengeluaran' && incomeCatNames.has(t.category.toLowerCase()) && !expenseCatNames.has(t.category.toLowerCase())
  );
  if (expenseUsingIncomeCat.length > 0) {
    issues.push({
      id: 'issue-exp-inc-cat',
      title: 'Pengeluaran Memakai Kategori Pemasukan',
      description: `${expenseUsingIncomeCat.length} transaksi pengeluaran menggunakan pos kategori pemasukan.`,
      severity: 'Warning',
      affectedCount: expenseUsingIncomeCat.length,
      recommendedAction: 'Ubah kategori transaksi menjadi pos pengeluaran.',
      affectedRecordIds: expenseUsingIncomeCat.map(t => t.id),
      linkTab: 'transactions',
    });
  }

  // 14. Missing holiday year
  const missingHolYear = holidays.filter(h => !h.year || isNaN(h.year));
  if (missingHolYear.length > 0) {
    issues.push({
      id: 'issue-holiday-year',
      title: 'Tahun Hari Libur Belum Ditetapkan',
      description: `${missingHolYear.length} hari libur tidak memiliki informasi tahun.`,
      severity: 'Info',
      affectedCount: missingHolYear.length,
      recommendedAction: 'Perbarui data hari libur agar filter tahun berfungsi optimal.',
      linkTab: 'holidays',
    });
  }

  return issues;
}
