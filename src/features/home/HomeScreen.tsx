import React, { useState } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  formatDateIndo,
  formatDateWithDay,
  formatPercentage,
  INDONESIAN_MONTHS,
} from '../../utils/formatters';
import { calculateMonthForecast } from '../../utils/financialCalculations';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { BudgetQuickModal } from '../../components/forms/BudgetQuickModal';

export const HomeScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    summary,
    monthTransactions,
    openTxModal,
    setActiveTab,
    currentBudget,
    loadDemoData,
  } = useFinancialData();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Today and upcoming calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAgendas = monthTransactions.filter(t => t.transactionDate === todayStr);

  const upcomingAgendas = monthTransactions
    .filter(t => t.transactionDate >= todayStr && t.paymentStatus !== 'Paid')
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))
    .slice(0, 5);

  const overBudgetAgendas = monthTransactions.filter(
    t => t.transactionType === 'Pengeluaran' && t.actualAmount > t.plannedAmount && t.plannedAmount > 0
  );

  const dueAgendas = monthTransactions.filter(
    t => t.paymentStatus === 'Due' || (t.paymentStatus === 'Planned' && t.plannedAmount > 0)
  );

  const forecast = calculateMonthForecast(summary, monthTransactions);

  // Status visual colors
  const getStatusStyle = () => {
    switch (summary.status) {
      case 'TERKENDALI':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          indicator: 'bg-emerald-400',
          desc: 'Pengeluaran terkendali dan berada di dalam batas dana yang tersedia.',
        };
      case 'BELUM ADA DANA':
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          indicator: 'bg-slate-400',
          desc: 'Belum ada alokasi budget awal maupun uang masuk tercatat.',
        };
      case 'PLAN MELEBIHI DANA':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          indicator: 'bg-amber-400',
          desc: 'Total rencana komitmen pengeluaran melebihi total dana yang ada.',
        };
      case 'AKTUAL MELEBIHI DANA':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          indicator: 'bg-rose-400',
          desc: 'Pengeluaran riil aktual telah melampaui seluruh dana yang tersedia.',
        };
      case 'AKTUAL > PLAN':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          indicator: 'bg-rose-400',
          desc: 'Realisasi pengeluaran lebih besar dari estimasi perencanaan.',
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          indicator: 'bg-slate-400',
          desc: '',
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Top Welcome & Monthly Status Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-lg ${statusStyle.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full shrink-0 ${statusStyle.indicator} animate-pulse`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Status Keuangan Bulan {INDONESIAN_MONTHS[monthNumber - 1]} {year}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {summary.status}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">{statusStyle.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setBudgetModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-teal-300" />
              {currentBudget ? 'Ubah Budget' : 'Atur Budget'}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              Buka Kalender
            </button>
          </div>
        </div>
      </div>

      {/* 2. Core 8 Financial KPI Cards (Section B Formulas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Budget Awal */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Budget Awal</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white truncate">
            {formatRupiah(summary.initialMonthlyBudget)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Alokasi awal bulan</p>
        </div>

        {/* Card 2: Uang Masuk */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Uang Masuk</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 truncate">
            {formatRupiah(summary.actualIncome)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{summary.incomeTransactionCount} transaksi pemasukan</p>
        </div>

        {/* Card 3: Dana Tersedia */}
        <div className="bg-gradient-to-br from-teal-950/60 to-slate-800/80 border border-teal-600/40 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-teal-300 mb-1">
            <span className="text-xs font-medium">Dana Tersedia</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-teal-300 truncate">
            {formatRupiah(summary.availableFunds)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Budget Awal + Uang Masuk</p>
        </div>

        {/* Card 4: Plan Keluar */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Plan Keluar</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-blue-300 truncate">
            {formatRupiah(summary.plannedExpense)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Estimasi komitmen belanja</p>
        </div>

        {/* Card 5: Aktual Keluar */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Aktual Keluar</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400 truncate">
            {formatRupiah(summary.actualExpense)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{summary.expenseTransactionCount} transaksi riil</p>
        </div>

        {/* Card 6: Sisa Dana Riil */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Sisa Dana Riil</span>
            <span className={`w-2 h-2 rounded-full ${summary.actualRemainingFunds >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono truncate ${
            summary.actualRemainingFunds >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatRupiah(summary.actualRemainingFunds)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Dana Tersedia - Aktual</p>
        </div>

        {/* Card 7: Sisa setelah Plan */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Sisa stlh Plan</span>
            <span className={`w-2 h-2 rounded-full ${summary.remainingFundsAfterPlan >= 0 ? 'bg-sky-400' : 'bg-amber-400'}`} />
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono truncate ${
            summary.remainingFundsAfterPlan >= 0 ? 'text-sky-300' : 'text-amber-400'
          }`}>
            {formatRupiah(summary.remainingFundsAfterPlan)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Dana Tersedia - Plan</p>
        </div>

        {/* Card 8: Utilisasi Budget */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Utilisasi</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono truncate ${
            summary.budgetUtilization > 1 ? 'text-rose-400' : 'text-purple-300'
          }`}>
            {formatPercentage(summary.budgetUtilization)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Varians: {formatRupiah(summary.planVsActualVariance)}
          </p>
        </div>
      </div>

      {/* 3. Quick Action Row */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Aksi Cepat:
        </span>
        <button
          onClick={() => openTxModal({ transactionType: 'Pengeluaran' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Pengeluaran
        </button>
        <button
          onClick={() => openTxModal({ transactionType: 'Pemasukan' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Pemasukan
        </button>
        <button
          onClick={() => setBudgetModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
        >
          <Wallet className="w-3.5 h-3.5" />
          Atur Budget
        </button>
        <button
          onClick={() => setActiveTab('import-export')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition ml-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
          Export Laporan
        </button>
      </div>

      {/* 4. Forecasting & Cashflow Outlook Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-purple-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
              Business Logic Forecast (Section M)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Proyeksi Saldo Akhir Bulan (End-of-Month Forecast)
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Estimasi Saldo Akhir:</span>
            <span className={`text-lg sm:text-xl font-bold font-mono ${
              forecast.forecastedEndOfMonthBalance >= 0 ? 'text-purple-300' : 'text-rose-400'
            }`}>
              {formatRupiah(forecast.forecastedEndOfMonthBalance)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Sisa Dana Kas Riil:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatRupiah(forecast.actualRemainingFunds)}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Komitmen Plan Belum Aktual:</span>
            <span className="font-mono font-bold text-sky-400">
              {formatRupiah(forecast.outstandingPlannedExpenses)}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Ekspektasi Uang Masuk Tertunda:</span>
            <span className="font-mono font-bold text-teal-400">
              {formatRupiah(forecast.expectedIncomeNotReceived)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Agendas Grid: Hari Ini & Mendatang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Hari Ini */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Agenda Hari Ini</h3>
            </div>
            <span className="text-xs text-slate-400">{formatDateIndo(todayStr)}</span>
          </div>

          {todayAgendas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Clock className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-xs">Tidak ada agenda transaksi untuk hari ini.</p>
              <button
                onClick={() => openTxModal({ transactionDate: todayStr })}
                className="mt-3 text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Agenda Hari Ini
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAgendas.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => openTxModal(tx)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{tx.agendaTitle}</h4>
                    <span className="text-[10px] text-slate-400">
                      {tx.category} • {tx.personInCharge || 'Tanpa PIC'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold block ${
                      tx.transactionType === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agenda Jatuh Tempo & Mendatang */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Agenda Mendatang & Jatuh Tempo</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingAgendas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-xs">Semua rencana transaksi telah selesai atau dibayar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAgendas.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => openTxModal(tx)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{tx.agendaTitle}</h4>
                    <span className="text-[10px] text-slate-400">
                      {formatDateWithDay(tx.transactionDate)} • {tx.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-sky-400 block">
                      {formatRupiah(tx.plannedAmount || tx.actualAmount)}
                    </span>
                    <span className={`text-[10px] font-semibold ${tx.paymentStatus === 'Due' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {tx.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Over-Budget Alerts Card (if any) */}
      {overBudgetAgendas.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-rose-400 mb-2 font-bold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Peringatan Over Budget ({overBudgetAgendas.length} Transaksi Melampaui Rencana)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
            {overBudgetAgendas.map(t => (
              <div
                key={t.id}
                onClick={() => openTxModal(t)}
                className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30 cursor-pointer hover:border-rose-400 transition"
              >
                <div className="text-xs font-semibold text-white truncate">{t.agendaTitle}</div>
                <div className="text-[10px] text-slate-400">{formatDateIndo(t.transactionDate)}</div>
                <div className="flex justify-between items-center mt-2 text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">Plan: {formatRupiah(t.plannedAmount)}</span>
                  <span className="text-rose-400 font-bold">Aktual: {formatRupiah(t.actualAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Budget Modal */}
      <BudgetQuickModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
      />
    </div>
  );
};
