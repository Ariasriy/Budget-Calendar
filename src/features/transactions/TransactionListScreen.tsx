import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  formatDateIndo,
  INDONESIAN_MONTHS,
} from '../../utils/formatters';
import { Transaction, TransactionType, PaymentStatus } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  Paperclip,
  RotateCcw,
} from 'lucide-react';
import { ExcelService } from '../../services/excelService';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const TransactionListScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    transactions,
    categories,
    openTxModal,
    deleteTransaction,
  } = useFinancialData();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'agenda'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion confirm
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Period filter
    if (filterPeriod === 'month') {
      const prefix = `${year}-${String(monthNumber).padStart(2, '0')}`;
      result = result.filter(t => t.transactionDate.startsWith(prefix));
    } else if (filterPeriod === 'year') {
      result = result.filter(t => t.transactionDate.startsWith(`${year}-`));
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(t => t.transactionType === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    // Payment status filter
    if (filterStatus !== 'all') {
      result = result.filter(t => t.paymentStatus === filterStatus || t.status === filterStatus);
    }

    // Search term
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        t =>
          t.agendaTitle.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.personInCharge && t.personInCharge.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = a.transactionDate.localeCompare(b.transactionDate);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      if (sortBy === 'amount') {
        const valA = a.actualAmount || a.plannedAmount;
        const valB = b.actualAmount || b.plannedAmount;
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      if (sortBy === 'agenda') {
        const cmp = a.agendaTitle.localeCompare(b.agendaTitle);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return 0;
    });

    return result;
  }, [
    transactions,
    year,
    monthNumber,
    filterPeriod,
    filterType,
    filterCategory,
    filterStatus,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  // Aggregate stats of filtered transactions
  const totals = useMemo(() => {
    let income = 0;
    let expensePlan = 0;
    let expenseActual = 0;

    filteredTransactions.forEach(t => {
      if (t.transactionType === 'Pemasukan') {
        income += t.actualAmount || 0;
      } else {
        expensePlan += t.plannedAmount || 0;
        expenseActual += t.actualAmount || 0;
      }
    });

    return {
      income,
      expensePlan,
      expenseActual,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    ExcelService.exportTransactionsCSV(
      filteredTransactions,
      `Transaksi_${filterPeriod === 'month' ? `${year}_Bulan_${monthNumber}` : year}.csv`
    );
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Daftar Transaksi & Agenda
          </h2>
          <p className="text-xs text-slate-400">
            Pencarian cepat, pelacakan riwayat multi-tahun, dan ekspor data CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => openTxModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari agenda, PIC, catatan, no ref..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Period selector */}
          <select
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="month">Bulan Ini ({INDONESIAN_MONTHS[monthNumber - 1]} {year})</option>
            <option value="year">Sepanjang Tahun ({year})</option>
            <option value="all">Semua Riwayat Data</option>
          </select>

          {/* Type selector */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Semua Tipe Transaksi</option>
            <option value="Pengeluaran">Hanya Pengeluaran</option>
            <option value="Pemasukan">Hanya Pemasukan</option>
          </select>

          {/* Category selector */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.categoryName}>
                {c.categoryName} ({c.transactionType})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Stats Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Menampilkan <strong className="text-white font-mono">{totals.count}</strong> transaksi
          </div>
          <div className="flex items-center gap-3 font-mono">
            {totals.income > 0 && (
              <span className="text-emerald-400 font-bold">
                +In: {formatRupiah(totals.income)}
              </span>
            )}
            {totals.expensePlan > 0 && (
              <span className="text-sky-400">
                Plan: {formatRupiah(totals.expensePlan)}
              </span>
            )}
            {totals.expenseActual > 0 && (
              <span className="text-rose-400 font-bold">
                Aktual: {formatRupiah(totals.expenseActual)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. DESKTOP Table View */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('date'); setSortOrder('desc'); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'agenda') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('agenda'); setSortOrder('asc'); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Agenda & PIC</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Kategori</th>
                <th
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('amount'); setSortOrder('desc'); }
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Plan / Aktual</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Varians & Status</th>
                <th className="py-3 px-4 text-center">Status Bayar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => openTxModal(tx)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                      {formatDateIndo(tx.transactionDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{tx.agendaTitle}</span>
                        {tx.isRecurring && (
                          <span title="Transaksi berulang"><RotateCcw className="w-3 h-3 text-teal-400" /></span>
                        )}
                        {tx.attachments && tx.attachments.length > 0 && (
                          <span title="Memiliki lampiran"><Paperclip className="w-3 h-3 text-sky-400" /></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.personInCharge ? `PIC: ${tx.personInCharge}` : 'Tanpa PIC'}
                        {tx.referenceNumber && ` • Ref: ${tx.referenceNumber}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tx.transactionType === 'Pemasukan'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className={`font-bold ${tx.transactionType === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                      </div>
                      {tx.transactionType === 'Pengeluaran' && (
                        <div className="text-[10px] text-sky-400">
                          Plan: {formatRupiah(tx.plannedAmount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-mono text-[11px] font-semibold ${tx.varianceAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatRupiah(tx.varianceAmount)}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        tx.status === 'Over Budget'
                          ? 'text-rose-400'
                          : tx.status === 'On/Under Budget' || tx.status === 'Diterima'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                        tx.paymentStatus === 'Paid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : tx.paymentStatus === 'Due'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setDeletingTx(tx)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MOBILE Card List View */}
      <div className="md:hidden space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
            Tidak ada transaksi yang cocok.
          </div>
        ) : (
          filteredTransactions.map(tx => (
            <div
              key={tx.id}
              onClick={() => openTxModal(tx)}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{tx.agendaTitle}</span>
                    {tx.isRecurring && <RotateCcw className="w-3 h-3 text-teal-400" />}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {formatDateIndo(tx.transactionDate)} • {tx.category}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                  tx.paymentStatus === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {tx.paymentStatus}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-xs font-mono">
                <div>
                  {tx.plannedAmount > 0 && (
                    <span className="text-sky-400 text-[10px] block">
                      Plan: {formatRupiah(tx.plannedAmount)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{tx.status}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${tx.transactionType === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTx}
        title="Hapus Transaksi?"
        message={`Hapus transaksi "${deletingTx?.agendaTitle}" secara permanen?`}
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deletingTx) {
            deleteTransaction(deletingTx.id);
            setDeletingTx(null);
          }
        }}
        onCancel={() => setDeletingTx(null)}
      />
    </div>
  );
};
