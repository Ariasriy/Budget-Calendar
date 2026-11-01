import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  parseRupiahInput,
  INDONESIAN_MONTHS,
} from '../../utils/formatters';
import { MonthlyBudget } from '../../types';
import {
  Wallet,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const MonthlyBudgetScreen: React.FC = () => {
  const {
    year,
    setYear,
    budgets,
    saveBudget,
    copyYearBudgets,
    user,
  } = useFinancialData();

  // Multi-month bulk apply modal or drawer
  const [bulkAmountInput, setBulkAmountInput] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Copy previous year confirmation
  const [confirmCopyYearOpen, setConfirmCopyYearOpen] = useState(false);

  // Editable values for all 12 months in current year
  const [editingBudgets, setEditingBudgets] = useState<{ [monthNumber: number]: { amount: string; notes: string } }>({});

  // Get current year's budgets
  const yearBudgets = useMemo(() => {
    return budgets.filter(b => b.year === year);
  }, [budgets, year]);

  // Annual total
  const annualTotal = useMemo(() => {
    return yearBudgets.reduce((sum, b) => sum + (b.initialBudget || 0), 0);
  }, [yearBudgets]);

  // Handle single month quick inline save
  const handleSaveMonth = (monthNumber: number, initialAmount: number, notesText?: string) => {
    const existing = yearBudgets.find(b => b.monthNumber === monthNumber);
    saveBudget({
      userId: user.id,
      year,
      monthNumber,
      monthName: INDONESIAN_MONTHS[monthNumber - 1],
      initialBudget: initialAmount,
      notes: notesText || existing?.notes || '',
      ...(existing ? { id: existing.id } : {}),
    });
  };

  // Copy from previous month
  const handleCopyFromPrevMonth = (monthNumber: number) => {
    if (monthNumber <= 1) return;
    const prevBudget = yearBudgets.find(b => b.monthNumber === monthNumber - 1);
    if (!prevBudget) {
      alert(`Budget untuk bulan ${INDONESIAN_MONTHS[monthNumber - 2]} belum diisi.`);
      return;
    }
    handleSaveMonth(monthNumber, prevBudget.initialBudget, `Disalin dari ${prevBudget.monthName}`);
  };

  // Apply to multiple selected months
  const handleApplyBulk = () => {
    const amount = parseRupiahInput(bulkAmountInput);
    if (amount < 0) return;
    if (selectedMonths.length === 0) {
      alert('Pilih minimal satu bulan.');
      return;
    }

    selectedMonths.forEach(mNum => {
      handleSaveMonth(mNum, amount, 'Ditetapkan secara massal');
    });

    setShowBulkModal(false);
    setSelectedMonths([]);
    setBulkAmountInput('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Manajemen Budget Bulanan & Tahunan
            </h2>
            <p className="text-xs text-slate-400">
              Alokasi budget awal terisolasi per tahun & per bulan tanpa saling tumpang tindih
            </p>
          </div>
        </div>

        {/* Year Selector & Copy Tools */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setYear(year - 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-teal-300 font-mono">
              Tahun {year}
            </span>
            <button
              onClick={() => setYear(year + 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setConfirmCopyYearOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Salin alokasi budget dari tahun sebelumnya"
          >
            <Copy className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Salin Tahun {year - 1}</span>
            <span className="sm:hidden">Salin Thn Lalu</span>
          </button>

          <button
            onClick={() => {
              setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
              setShowBulkModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alokasi Massal</span>
          </button>
        </div>
      </div>

      {/* 2. Annual Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400">Total Alokasi Anggaran Tahunan ({year})</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-teal-300 mt-0.5">
            {formatRupiah(annualTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata bulanan: <strong className="text-white font-mono">{formatRupiah(annualTotal / 12)}</strong>
          </p>
        </div>

        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-xs text-slate-300 max-w-sm">
          💡 <strong>Prinsip Isolasi Data:</strong> Nilai budget pada tahun {year} tersimpan secara independen. Mengubah nilai di tahun {year} tidak akan memengaruhi tahun {year - 1} maupun {year + 1}.
        </div>
      </div>

      {/* 3. 12-Month Grid (Januari - Desember) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {INDONESIAN_MONTHS.map((monthName, idx) => {
          const monthNum = idx + 1;
          const currentRecord = yearBudgets.find(b => b.monthNumber === monthNum);
          const currentAmount = currentRecord?.initialBudget || 0;
          const currentNotes = currentRecord?.notes || '';

          const draftAmount = editingBudgets[monthNum]?.amount ?? (currentAmount > 0 ? currentAmount.toLocaleString('id-ID') : '');
          const draftNotes = editingBudgets[monthNum]?.notes ?? currentNotes;

          return (
            <div
              key={monthName}
              className={`bg-slate-900 border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition ${
                currentAmount > 0 ? 'border-slate-800' : 'border-slate-800/60 bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-teal-400 text-xs font-bold flex items-center justify-center font-mono">
                      {monthNum}
                    </span>
                    <h3 className="text-sm font-bold text-white">{monthName}</h3>
                  </div>

                  {monthNum > 1 && (
                    <button
                      onClick={() => handleCopyFromPrevMonth(monthNum)}
                      className="text-[10px] text-slate-400 hover:text-teal-300 flex items-center gap-1 transition"
                      title="Salin nominal dari bulan sebelumnya"
                    >
                      <Copy className="w-3 h-3" /> Salin bln lalu
                    </button>
                  )}
                </div>

                {/* Input Amount */}
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Budget Awal Bulan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={draftAmount}
                      onChange={e => {
                        const parsed = parseRupiahInput(e.target.value);
                        setEditingBudgets(prev => ({
                          ...prev,
                          [monthNum]: {
                            amount: parsed === 0 ? '' : parsed.toLocaleString('id-ID'),
                            notes: prev[monthNum]?.notes ?? currentNotes,
                          },
                        }));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="mt-2.5">
                  <input
                    type="text"
                    placeholder="Catatan / alokasi khusus..."
                    value={draftNotes}
                    onChange={e => {
                      setEditingBudgets(prev => ({
                        ...prev,
                        [monthNum]: {
                          amount: prev[monthNum]?.amount ?? (currentAmount > 0 ? currentAmount.toLocaleString('id-ID') : ''),
                          notes: e.target.value,
                        },
                      }));
                    }}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentRecord ? 'Tersimpan' : 'Belum diisi'}
                </span>
                <button
                  onClick={() => {
                    const finalAmount = parseRupiahInput(draftAmount);
                    handleSaveMonth(monthNum, finalAmount, draftNotes);
                  }}
                  className="px-3 py-1 rounded-xl bg-teal-600/80 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Apply Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">Terapkan Budget Massal</h3>
            <p className="text-xs text-slate-400 mb-4">
              Terapkan satu nominal budget ke beberapa bulan sekaligus pada tahun {year}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Budget (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 15.000.000"
                    value={bulkAmountInput}
                    onChange={e => {
                      const val = parseRupiahInput(e.target.value);
                      setBulkAmountInput(val === 0 ? '' : val.toLocaleString('id-ID'));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Bulan Sasaran
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                  {INDONESIAN_MONTHS.map((name, idx) => {
                    const mNum = idx + 1;
                    const isSelected = selectedMonths.includes(mNum);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSelectedMonths(prev =>
                            isSelected ? prev.filter(m => m !== mNum) : [...prev, mNum]
                          );
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleApplyBulk}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-500/20"
              >
                Terapkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Year Confirmation */}
      <ConfirmDialog
        isOpen={confirmCopyYearOpen}
        title={`Salin Budget dari Tahun ${year - 1}?`}
        message={`Apakah Anda ingin menyalin seluruh alokasi budget bulanan dari tahun ${year - 1} ke tahun ${year}? Alokasi yang telah ada di tahun ${year} akan ditimpa jika sudah ada.`}
        confirmLabel={`Ya, Salin ke ${year}`}
        isDestructive={false}
        onConfirm={() => {
          copyYearBudgets(year - 1, year, true);
          setConfirmCopyYearOpen(false);
        }}
        onCancel={() => setConfirmCopyYearOpen(false)}
      />
    </div>
  );
};
