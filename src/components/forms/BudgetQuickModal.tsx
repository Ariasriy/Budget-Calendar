import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { formatRupiah, parseRupiahInput, INDONESIAN_MONTHS } from '../../utils/formatters';
import { X, CheckCircle2, Wallet } from 'lucide-react';

interface BudgetQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetQuickModal: React.FC<BudgetQuickModalProps> = ({ isOpen, onClose }) => {
  const { year, monthNumber, currentBudget, saveBudget } = useFinancialData();
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentBudget) {
        setBudgetInput(currentBudget.initialBudget > 0 ? currentBudget.initialBudget.toLocaleString('id-ID') : '');
        setNotes(currentBudget.notes || '');
      } else {
        setBudgetInput('');
        setNotes('');
      }
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRupiahInput(budgetInput);

    saveBudget({
      year,
      monthNumber,
      monthName: INDONESIAN_MONTHS[monthNumber - 1],
      initialBudget: amount,
      notes: notes.trim(),
      ...(currentBudget?.id ? { id: currentBudget.id } : {}),
      userId: currentBudget?.userId || 'user-owner-default',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Atur Budget Awal Bulan</h3>
              <p className="text-xs text-slate-400">
                {INDONESIAN_MONTHS[monthNumber - 1]} {year}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alokasi Budget Awal (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={budgetInput}
                onChange={e => {
                  const val = parseRupiahInput(e.target.value);
                  setBudgetInput(val === 0 ? '' : val.toLocaleString('id-ID'));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Jumlah dana awal yang disiapkan pada awal bulan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan / Alokasi Strategis
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Termasuk alokasi sewa kantor dan darurat"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
