import React from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { INDONESIAN_MONTHS } from '../../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    year,
    monthNumber,
    setYear,
    setMonthNumber,
    summary,
    openTxModal,
  } = useFinancialData();

  const handlePrevMonth = () => {
    if (monthNumber === 1) {
      setMonthNumber(12);
      setYear(year - 1);
    } else {
      setMonthNumber(monthNumber - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthNumber === 12) {
      setMonthNumber(1);
      setYear(year + 1);
    } else {
      setMonthNumber(monthNumber + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonthNumber(now.getMonth() + 1);
  };

  // Status visual color and badge
  const getStatusBadge = () => {
    switch (summary.status) {
      case 'TERKENDALI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            TERKENDALI
          </span>
        );
      case 'BELUM ADA DANA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            BELUM ADA DANA
          </span>
        );
      case 'PLAN MELEBIHI DANA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            PLAN MELEBIHI DANA
          </span>
        );
      case 'AKTUAL MELEBIHI DANA':
      case 'AKTUAL > PLAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            {summary.status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Title on Mobile / Left Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/20 text-white font-black text-sm">
              Rp
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                Budget Calendar
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Cashflow & Spending Monitoring</p>
            </div>
          </div>

          {/* Monthly Status Badge */}
          <div className="hidden md:block">
            {getStatusBadge()}
          </div>
        </div>

        {/* Month & Year Navigation Control */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Selector */}
          <select
            value={monthNumber}
            onChange={e => setMonthNumber(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer py-1 px-1 sm:px-2 rounded-lg hover:bg-slate-700/40"
          >
            {INDONESIAN_MONTHS.map((name, idx) => (
              <option key={name} value={idx + 1} className="bg-slate-800 text-white">
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs sm:text-sm font-bold text-teal-400 focus:outline-none cursor-pointer py-1 px-1 sm:px-2 rounded-lg hover:bg-slate-700/40"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={y} className="bg-slate-800 text-white">
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition ml-1"
          >
            <CalendarIcon className="w-3 h-3 text-teal-400" />
            Hari Ini
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={() => openTxModal()}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>
    </header>
  );
};
