import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  formatDateIndo,
  INDONESIAN_MONTHS,
  INDONESIAN_DAYS_SHORT,
  INDONESIAN_DAYS_FULL,
} from '../../utils/formatters';
import {
  Transaction,
  Holiday,
} from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Calendar as CalendarIcon,
  X,
  Clock,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface CalendarDayData {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeekIndex: number; // 0: Senin, ... 6: Minggu
  holiday?: Holiday;
  transactions: Transaction[];
  plannedExpenseTotal: number;
  actualIncomeTotal: number;
  actualExpenseTotal: number;
  isActualExceedsPlan: boolean;
}

export const CalendarScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    setYear,
    setMonthNumber,
    monthTransactions,
    transactions,
    holidays,
    summary,
    openTxModal,
  } = useFinancialData();

  // Selected date for daily drawer/modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  // Mobile view mode: 'list' (Vertical Daily Agenda) or 'grid' (Compact Calendar)
  const [mobileView, setMobileView] = useState<'list' | 'grid'>('list');

  // Month navigation
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

  // Build calendar matrix (Monday to Sunday)
  const calendarDays = useMemo(() => {
    const result: CalendarDayData[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // First day of target month: get day of week (0 is Sunday, 1 is Monday ... 6 is Saturday)
    const firstDayOfMonth = new Date(year, monthNumber - 1, 1);
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon, ...
    // Convert to Monday = 0, Sunday = 6
    const mondayBasedStart = (startDayOfWeek + 6) % 7;

    const daysInCurrentMonth = new Date(year, monthNumber, 0).getDate();
    const daysInPrevMonth = new Date(year, monthNumber - 1, 0).getDate();

    // 1. Previous month padding days
    const prevMonthNumber = monthNumber === 1 ? 12 : monthNumber - 1;
    const prevYear = monthNumber === 1 ? year - 1 : year;
    for (let i = mondayBasedStart - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonthNumber).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.transactionDate === dateStr);
      const holiday = holidays.find(h => h.holidayDate === dateStr);
      const dayOfWeek = result.length % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      let plannedExp = 0;
      let actualInc = 0;
      let actualExp = 0;
      dayTxs.forEach(t => {
        if (t.transactionType === 'Pemasukan') {
          actualInc += t.actualAmount || 0;
        } else {
          plannedExp += t.plannedAmount || 0;
          actualExp += t.actualAmount || 0;
        }
      });

      result.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        dayOfWeekIndex: dayOfWeek,
        holiday,
        transactions: dayTxs,
        plannedExpenseTotal: plannedExp,
        actualIncomeTotal: actualInc,
        actualExpenseTotal: actualExp,
        isActualExceedsPlan: actualExp > plannedExp && plannedExp > 0,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.transactionDate === dateStr);
      const holiday = holidays.find(h => h.holidayDate === dateStr);
      const dayOfWeek = result.length % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      let plannedExp = 0;
      let actualInc = 0;
      let actualExp = 0;
      dayTxs.forEach(t => {
        if (t.transactionType === 'Pemasukan') {
          actualInc += t.actualAmount || 0;
        } else {
          plannedExp += t.plannedAmount || 0;
          actualExp += t.actualAmount || 0;
        }
      });

      result.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend,
        dayOfWeekIndex: dayOfWeek,
        holiday,
        transactions: dayTxs,
        plannedExpenseTotal: plannedExp,
        actualIncomeTotal: actualInc,
        actualExpenseTotal: actualExp,
        isActualExceedsPlan: actualExp > plannedExp && plannedExp > 0,
      });
    }

    // 3. Next month padding days to complete standard 5 or 6 weeks (up to 35 or 42 cells)
    const totalCells = result.length <= 35 ? 35 : 42;
    const remaining = totalCells - result.length;
    const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
    const nextYear = monthNumber === 12 ? year + 1 : year;

    for (let day = 1; day <= remaining; day++) {
      const dateStr = `${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.transactionDate === dateStr);
      const holiday = holidays.find(h => h.holidayDate === dateStr);
      const dayOfWeek = result.length % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      let plannedExp = 0;
      let actualInc = 0;
      let actualExp = 0;
      dayTxs.forEach(t => {
        if (t.transactionType === 'Pemasukan') {
          actualInc += t.actualAmount || 0;
        } else {
          plannedExp += t.plannedAmount || 0;
          actualExp += t.actualAmount || 0;
        }
      });

      result.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        dayOfWeekIndex: dayOfWeek,
        holiday,
        transactions: dayTxs,
        plannedExpenseTotal: plannedExp,
        actualIncomeTotal: actualInc,
        actualExpenseTotal: actualExp,
        isActualExceedsPlan: actualExp > plannedExp && plannedExp > 0,
      });
    }

    return result;
  }, [year, monthNumber, transactions, holidays]);

  // Selected date's full transactions for the Drawer/Modal
  const selectedDayData = useMemo(() => {
    if (!selectedDateStr) return null;
    return calendarDays.find(d => d.dateStr === selectedDateStr) || null;
  }, [selectedDateStr, calendarDays]);

  return (
    <div className="space-y-4 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Kalender Monitoring Budget & Cashflow
            </h2>
            <p className="text-xs text-slate-400">
              {INDONESIAN_MONTHS[monthNumber - 1]} {year} • Monitoring multi-agenda per hari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="lg:hidden flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setMobileView('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                mobileView === 'list' ? 'bg-teal-600 text-white' : 'text-slate-400'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setMobileView('grid')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                mobileView === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-400'
              }`}
            >
              Grid
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Hari Ini
          </button>
          <button
            onClick={() => openTxModal()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* 2. Monthly Summary Pills in Calendar Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-slate-400">Dana Tersedia:</span>
          <span className="font-mono font-bold text-teal-300">{formatRupiah(summary.availableFunds)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-slate-400">Plan Keluar:</span>
          <span className="font-mono font-bold text-sky-400">{formatRupiah(summary.plannedExpense)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-slate-400">Aktual Keluar:</span>
          <span className="font-mono font-bold text-rose-400">{formatRupiah(summary.actualExpense)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-slate-400">Sisa Kas Riil:</span>
          <span className={`font-mono font-bold ${summary.actualRemainingFunds >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(summary.actualRemainingFunds)}
          </span>
        </div>
      </div>

      {/* 3. DESKTOP & TABLET: 7-Column Monday-Sunday Grid View */}
      <div className={`hidden ${mobileView === 'grid' ? '!block lg:block' : 'lg:block'}`}>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          {/* Day Names Header (Senin to Minggu) */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-800/40 text-center text-xs font-bold text-slate-300 py-3">
            {INDONESIAN_DAYS_SHORT.map((dayName, idx) => {
              const isWeekend = idx === 5 || idx === 6;
              return (
                <div key={dayName} className={`${isWeekend ? 'text-rose-400' : 'text-slate-300'}`}>
                  {dayName}
                </div>
              );
            })}
          </div>

          {/* 7-Columns Date Cards Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-800/20 gap-px">
            {calendarDays.map((day, idx) => {
              const hasTxs = day.transactions.length > 0;
              const isHoliday = !!day.holiday;

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col justify-between transition group cursor-pointer border-b border-r border-slate-800/80 ${
                    !day.isCurrentMonth
                      ? 'bg-slate-950/60 opacity-40 hover:opacity-80'
                      : day.isToday
                      ? 'bg-teal-950/30 ring-1 ring-teal-500/50'
                      : day.isWeekend
                      ? 'bg-slate-900/90'
                      : 'bg-slate-900/70 hover:bg-slate-800/60'
                  }`}
                >
                  {/* Top Bar of Date Cell */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-lg ${
                          day.isToday
                            ? 'bg-teal-500 text-white shadow-sm'
                            : isHoliday
                            ? 'bg-rose-500/20 text-rose-300 font-extrabold'
                            : day.isWeekend
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-200'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Warning badges */}
                      <div className="flex items-center gap-1">
                        {day.isActualExceedsPlan && (
                          <span title="Aktual melebihi rencana!" className="p-0.5 rounded bg-rose-500/20 text-rose-400">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                          </span>
                        )}
                        {hasTxs && (
                          <span className="text-[10px] px-1 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono font-semibold">
                            {day.transactions.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Holiday Label if present */}
                    {isHoliday && (
                      <div
                        className={`text-[10px] font-semibold px-1 py-0.5 rounded mb-1 truncate ${
                          day.holiday?.holidayType === 'Libur Nasional'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        }`}
                        title={day.holiday?.holidayName}
                      >
                        {day.holiday?.holidayName}
                      </div>
                    )}

                    {/* Agendas list inside date card (Multiple agendas support!) */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {day.transactions.slice(0, 2).map(tx => (
                        <div
                          key={tx.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center justify-between gap-1 ${
                            tx.transactionType === 'Pemasukan'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                              : tx.actualAmount > tx.plannedAmount && tx.plannedAmount > 0
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="truncate">{tx.agendaTitle}</span>
                          <span className="font-mono text-[9px] shrink-0 font-bold">
                            {formatRupiah(tx.actualAmount || tx.plannedAmount, false)}
                          </span>
                        </div>
                      ))}

                      {/* Explicit "+N agenda lainnya" link as requested in spec */}
                      {day.transactions.length > 2 && (
                        <span className="text-[10px] font-semibold text-teal-400 hover:text-teal-300 block text-right pt-0.5">
                          +{day.transactions.length - 2} agenda lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Day Financial Totals */}
                  {hasTxs && (
                    <div className="pt-1 border-t border-slate-800/80 text-[10px] space-y-0.5 font-mono">
                      {day.actualIncomeTotal > 0 && (
                        <div className="text-emerald-400 flex justify-between">
                          <span>+In:</span>
                          <span>{formatRupiah(day.actualIncomeTotal, false)}</span>
                        </div>
                      )}
                      {day.plannedExpenseTotal > 0 && (
                        <div className="text-sky-400 flex justify-between">
                          <span>Pl:</span>
                          <span>{formatRupiah(day.plannedExpenseTotal, false)}</span>
                        </div>
                      )}
                      {day.actualExpenseTotal > 0 && (
                        <div className="text-rose-400 flex justify-between font-bold">
                          <span>Ak:</span>
                          <span>{formatRupiah(day.actualExpenseTotal, false)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MOBILE: Dedicated Responsive Vertical Daily Agenda List */}
      <div className={`lg:hidden ${mobileView === 'list' ? 'block' : 'hidden'}`}>
        <div className="space-y-3">
          {calendarDays
            .filter(d => d.isCurrentMonth)
            .map(day => {
              const hasTxs = day.transactions.length > 0;
              const isHoliday = !!day.holiday;

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border p-3.5 transition ${
                    day.isToday
                      ? 'bg-slate-900 border-teal-500/60 shadow-md ring-1 ring-teal-500/30'
                      : day.isWeekend
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                          day.isToday
                            ? 'bg-teal-500 text-white'
                            : day.isWeekend || isHoliday
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{INDONESIAN_DAYS_FULL[new Date(day.dateStr + 'T00:00:00').getDay()]}</span>
                          {day.isToday && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded-full font-semibold">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        {isHoliday && (
                          <span className="text-[10px] text-rose-400 font-semibold block">
                            {day.holiday?.holidayName} ({day.holiday?.holidayType})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => openTxModal({ transactionDate: day.dateStr })}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400"
                      title="Tambah transaksi pada tanggal ini"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* All Transactions for this Date */}
                  {hasTxs ? (
                    <div className="mt-2.5 space-y-2">
                      {day.transactions.map(tx => (
                        <div
                          key={tx.id}
                          onClick={() => openTxModal(tx)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-white">{tx.agendaTitle}</div>
                            <div className="text-[10px] text-slate-400">
                              {tx.category} • {tx.personInCharge || 'Tanpa PIC'} • {tx.status}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-bold block ${
                              tx.transactionType === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {tx.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                            </span>
                            {tx.transactionType === 'Pengeluaran' && tx.plannedAmount > 0 && (
                              <span className="text-[9px] text-sky-400 font-mono">
                                Plan: {formatRupiah(tx.plannedAmount)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Daily Totals Bar on Mobile */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <span>Total Rencana: <strong className="text-sky-400">{formatRupiah(day.plannedExpenseTotal)}</strong></span>
                        <span>Total Aktual: <strong className="text-rose-400">{formatRupiah(day.actualExpenseTotal)}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-center py-2 text-[11px] text-slate-500">
                      Tidak ada transaksi tercatat pada tanggal ini.
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 5. Date Detail Drawer / Modal for Desktop & Tablet */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-teal-400">Rincian Agenda Harian</span>
                <h3 className="text-base font-bold text-white">
                  {formatDateIndo(selectedDayData.dateStr)}
                </h3>
                {selectedDayData.holiday && (
                  <span className="text-xs text-rose-400 font-semibold block mt-0.5">
                    🎉 {selectedDayData.holiday.holidayName} ({selectedDayData.holiday.holidayType})
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 my-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Uang Masuk:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatRupiah(selectedDayData.actualIncomeTotal)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Plan Keluar:</span>
                <span className="font-mono font-bold text-sky-400">
                  {formatRupiah(selectedDayData.plannedExpenseTotal)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Aktual Keluar:</span>
                <span className="font-mono font-bold text-rose-400">
                  {formatRupiah(selectedDayData.actualExpenseTotal)}
                </span>
              </div>
            </div>

            {/* List of all agendas on this date */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {selectedDayData.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Belum ada agenda atau transaksi yang tercatat pada tanggal ini.
                </div>
              ) : (
                selectedDayData.transactions.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedDateStr(null);
                      openTxModal(tx);
                    }}
                    className="p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{tx.agendaTitle}</div>
                      <div className="text-[10px] text-slate-400">
                        {tx.category} • {tx.personInCharge || 'Tanpa PIC'} • {tx.status}
                      </div>
                      {tx.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{tx.notes}</div>}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold block ${
                        tx.transactionType === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetDate = selectedDayData.dateStr;
                  setSelectedDateStr(null);
                  openTxModal({ transactionDate: targetDate });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Agenda di Tanggal Ini
              </button>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
