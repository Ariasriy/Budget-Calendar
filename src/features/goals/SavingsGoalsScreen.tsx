import React, { useState } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { SavingsGoal } from '../../types';
import { formatRupiah, parseRupiahInput, formatDateIndo, formatPercentage } from '../../utils/formatters';
import {
  PiggyBank,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SavingsGoalsScreen: React.FC = () => {
  const { savingsGoals, saveSavingsGoal, deleteSavingsGoal, user } = useFinancialData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [goalName, setGoalName] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [currentAmountInput, setCurrentAmountInput] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContributionInput, setMonthlyContributionInput] = useState('');
  const [status, setStatus] = useState<SavingsGoal['status']>('In Progress');

  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  const openAddModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmountInput('');
    setCurrentAmountInput('');
    setTargetDate(`${new Date().getFullYear() + 1}-12-31`);
    setMonthlyContributionInput('');
    setStatus('In Progress');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.goalName);
    setTargetAmountInput(goal.targetAmount.toString());
    setCurrentAmountInput(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setMonthlyContributionInput(goal.monthlyContribution.toString());
    setStatus(goal.status);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      alert('Nama target tabungan harus diisi.');
      return;
    }

    const targetAmount = parseRupiahInput(targetAmountInput);
    const currentAmount = parseRupiahInput(currentAmountInput);
    const monthlyContribution = parseRupiahInput(monthlyContributionInput);

    const payload: SavingsGoal = {
      id: editingGoal?.id || `sg-${Date.now()}`,
      userId: user.id,
      goalName: goalName.trim(),
      targetAmount,
      currentAmount,
      targetDate: targetDate || `${new Date().getFullYear() + 1}-12-31`,
      monthlyContribution,
      status: currentAmount >= targetAmount && targetAmount > 0 ? 'Achieved' : status,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSavingsGoal(payload);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Target Tabungan & Rencana Finansial (Savings Goals)
            </h2>
            <p className="text-xs text-slate-400">
              Pelacakan komitmen tabungan masa depan tanpa mengurangi dana operasional aktif
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Target Tabungan</span>
        </button>
      </div>

      {/* 2. Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingsGoals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
            Belum ada target tabungan yang dibuat. Klik tombol di atas untuk membuat target baru.
          </div>
        ) : (
          savingsGoals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                onClick={() => openEditModal(goal)}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm hover:border-slate-700 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        goal.status === 'Achieved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : goal.status === 'In Progress'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {goal.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Target: {formatDateIndo(goal.targetDate)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{goal.goalName}</h4>

                  {/* Amount Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">{formatRupiah(goal.currentAmount)}</span>
                      <span className="text-slate-400">dari {formatRupiah(goal.targetAmount)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Progres: <strong className="text-white font-mono">{formatPercentage(progress)}</strong></span>
                      <span>Sisa: <strong className="text-rose-400 font-mono">{formatRupiah(remaining)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400" onClick={e => e.stopPropagation()}>
                  <span>Setoran/Bln: <strong className="text-teal-300 font-mono">{formatRupiah(goal.monthlyContribution)}</strong></span>
                  <button
                    onClick={() => setDeletingGoal(goal)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit Goal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingGoal ? 'Edit Target Tabungan' : 'Tambah Target Tabungan Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Target Tabungan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat 6 Bulan / DP Rumah"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nilai Target (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={targetAmountInput}
                    onChange={e => {
                      const val = parseRupiahInput(e.target.value);
                      setTargetAmountInput(val === 0 ? '' : val.toLocaleString('id-ID'));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Terkumpul Saat Ini (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={currentAmountInput}
                    onChange={e => {
                      const val = parseRupiahInput(e.target.value);
                      setCurrentAmountInput(val === 0 ? '' : val.toLocaleString('id-ID'));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Tanggal Capaian
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Alokasi per Bulan (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={monthlyContributionInput}
                    onChange={e => {
                      const val = parseRupiahInput(e.target.value);
                      setMonthlyContributionInput(val === 0 ? '' : val.toLocaleString('id-ID'));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Status Capaian
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="In Progress">In Progress (Sedang Berjalan)</option>
                  <option value="Achieved">Achieved (Tercapai)</option>
                  <option value="On Hold">On Hold (Ditunda)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        title="Hapus Target Tabungan?"
        message={`Hapus target tabungan "${deletingGoal?.goalName}"?`}
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deletingGoal) {
            deleteSavingsGoal(deletingGoal.id);
            setDeletingGoal(null);
          }
        }}
        onCancel={() => setDeletingGoal(null)}
      />
    </div>
  );
};
