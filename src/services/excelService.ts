/**
 * Excel & CSV Import/Export Service using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import { MonthlyFinancialSummary, Transaction, MonthlyBudget } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

export interface ImportValidationResult {
  validRows: Partial<Transaction>[];
  invalidRows: { rowNumber: number; reason: string; data: any }[];
  duplicateCount: number;
}

export class ExcelService {
  /**
   * Export comprehensive multi-sheet Excel workbook
   */
  public static exportMonthlyExcel(
    summary: MonthlyFinancialSummary,
    transactions: Transaction[],
    yearlyBudgets: MonthlyBudget[]
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Sheet: Ringkasan Eksekutif
    const summaryData = [
      ['BUDGET CALENDAR & CASHFLOW MONITORING - LAPORAN KEUANGAN'],
      ['Periode', `Bulan ${summary.monthNumber} - Tahun ${summary.year}`],
      ['Tanggal Dibuat', new Date().toLocaleString('id-ID')],
      [],
      ['INDIKATOR KEUANGAN', 'NILAI (RUPIAH)', 'KETERANGAN'],
      ['Budget Awal Bulan', summary.initialMonthlyBudget, 'Alokasi awal bulan'],
      ['Uang Masuk (Pemasukan Aktual)', summary.actualIncome, 'Total pemasukan riil diterima'],
      ['Dana Tersedia', summary.availableFunds, 'Budget Awal + Uang Masuk'],
      ['Plan Keluar (Komitmen)', summary.plannedExpense, 'Total rencana pengeluaran'],
      ['Aktual Keluar (Realisasi)', summary.actualExpense, 'Total pengeluaran riil'],
      ['Sisa Dana Riil', summary.actualRemainingFunds, 'Dana Tersedia - Aktual Keluar'],
      ['Sisa Dana Setelah Plan', summary.remainingFundsAfterPlan, 'Dana Tersedia - Plan Keluar'],
      ['Varians Plan vs Aktual', summary.planVsActualVariance, 'Plan Keluar - Aktual Keluar'],
      ['Utilisasi Budget (%)', `${(summary.budgetUtilization * 100).toFixed(1)}%`, 'Aktual Keluar / Dana Tersedia'],
      ['Status Keuangan Bulanan', summary.status, 'Evaluasi status otomatis'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

    // 2. Sheet: Detail Transaksi
    const txHeaders = [
      'ID',
      'Tanggal',
      'Tipe',
      'Judul Agenda',
      'Kategori',
      'Penanggung Jawab (PIC)',
      'Nilai Rencana (Plan)',
      'Nilai Aktual',
      'Varians',
      'Realisasi %',
      'Status',
      'Status Bayar',
      'Nomor Referensi',
      'Catatan',
    ];

    const txRows = transactions.map(t => [
      t.id,
      t.transactionDate,
      t.transactionType,
      t.agendaTitle,
      t.category,
      t.personInCharge || '',
      t.plannedAmount,
      t.actualAmount,
      t.varianceAmount,
      `${(t.realizationPercentage * 100).toFixed(0)}%`,
      t.status,
      t.paymentStatus,
      t.referenceNumber || '',
      t.notes || '',
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

    // 3. Sheet: Alokasi Budget Tahunan
    const budgetHeaders = ['Tahun', 'Nomor Bulan', 'Nama Bulan', 'Budget Awal (Rp)', 'Catatan'];
    const budgetRows = yearlyBudgets.map(b => [
      b.year,
      b.monthNumber,
      b.monthName,
      b.initialBudget,
      b.notes || '',
    ]);
    const wsBudgets = XLSX.utils.aoa_to_sheet([budgetHeaders, ...budgetRows]);
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budget Tahunan');

    // Write file
    XLSX.writeFile(wb, `Monitoring_Budget_${summary.year}_Bulan_${summary.monthNumber}.xlsx`);
  }

  /**
   * Export transactions to CSV format
   */
  public static exportTransactionsCSV(transactions: Transaction[], filename: string = 'transaksi.csv'): void {
    const headers = [
      'Tanggal',
      'Tipe',
      'Agenda',
      'Kategori',
      'PIC',
      'Plan',
      'Aktual',
      'Varians',
      'Status',
      'Status_Bayar',
      'Catatan',
    ];

    const rows = transactions.map(t => [
      t.transactionDate,
      t.transactionType,
      `"${(t.agendaTitle || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.personInCharge || '').replace(/"/g, '""')}"`,
      t.plannedAmount,
      t.actualAmount,
      t.varianceAmount,
      t.status,
      t.paymentStatus,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse uploaded Excel or CSV file
   */
  public static async parseFile(
    file: File,
    existingTransactions: Transaction[]
  ): Promise<ImportValidationResult> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    // Pick the first sheet or the sheet named "Daftar Transaksi" / "Transaksi"
    let sheetName = wb.SheetNames[0];
    const candidate = wb.SheetNames.find(s => s.toLowerCase().includes('transaksi') || s.toLowerCase().includes('data'));
    if (candidate) sheetName = candidate;

    const ws = wb.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const validRows: Partial<Transaction>[] = [];
    const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
    let duplicateCount = 0;

    const existingMap = new Set(
      existingTransactions.map(t => `${t.transactionDate}|${t.agendaTitle.toLowerCase()}|${t.transactionType}`)
    );

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // +1 for 0-index, +1 for header

      // Extract fields flexibly from Indonesian or English headers
      const dateRaw = row['Tanggal'] || row['Date'] || row['transactionDate'] || '';
      const typeRaw = row['Tipe'] || row['Type'] || row['transactionType'] || '';
      const titleRaw = row['Judul Agenda'] || row['Agenda'] || row['agendaTitle'] || row['Deskripsi'] || '';
      const catRaw = row['Kategori'] || row['Category'] || row['category'] || 'Lainnya';
      const picRaw = row['Penanggung Jawab (PIC)'] || row['PIC'] || row['personInCharge'] || '';
      const planRaw = row['Nilai Rencana (Plan)'] || row['Plan'] || row['plannedAmount'] || 0;
      const actualRaw = row['Nilai Aktual'] || row['Aktual'] || row['actualAmount'] || 0;
      const notesRaw = row['Catatan'] || row['Notes'] || row['notes'] || '';
      const refRaw = row['Nomor Referensi'] || row['Ref'] || row['referenceNumber'] || '';

      // Normalize date YYYY-MM-DD
      let normalizedDate = '';
      if (dateRaw instanceof Date) {
        normalizedDate = dateRaw.toISOString().split('T')[0];
      } else if (typeof dateRaw === 'string') {
        const trimmed = dateRaw.trim();
        // Check if YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          normalizedDate = trimmed;
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
          // DD/MM/YYYY
          const parts = trimmed.split('/');
          normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      if (!normalizedDate) {
        invalidRows.push({ rowNumber: rowNum, reason: 'Tanggal tidak valid atau kosong', data: row });
        return;
      }

      if (!titleRaw || String(titleRaw).trim() === '') {
        invalidRows.push({ rowNumber: rowNum, reason: 'Judul agenda tidak boleh kosong', data: row });
        return;
      }

      const normalizedType = String(typeRaw).toLowerCase().includes('masuk') || String(typeRaw).toLowerCase() === 'income'
        ? 'Pemasukan'
        : 'Pengeluaran';

      const planNum = Math.max(0, typeof planRaw === 'number' ? planRaw : parseFloat(String(planRaw).replace(/[^0-9.-]/g, '')) || 0);
      const actualNum = Math.max(0, typeof actualRaw === 'number' ? actualRaw : parseFloat(String(actualRaw).replace(/[^0-9.-]/g, '')) || 0);

      const dupKey = `${normalizedDate}|${String(titleRaw).trim().toLowerCase()}|${normalizedType}`;
      if (existingMap.has(dupKey)) {
        duplicateCount++;
      }

      validRows.push({
        transactionDate: normalizedDate,
        transactionType: normalizedType,
        agendaTitle: String(titleRaw).trim(),
        category: String(catRaw).trim() || (normalizedType === 'Pemasukan' ? 'Pendapatan Lain' : 'Lainnya'),
        personInCharge: String(picRaw).trim(),
        plannedAmount: planNum,
        actualAmount: actualNum,
        notes: String(notesRaw).trim(),
        referenceNumber: String(refRaw).trim(),
        paymentStatus: actualNum > 0 ? 'Paid' : 'Planned',
      });
    });

    return { validRows, invalidRows, duplicateCount };
  }
}
