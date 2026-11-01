import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { Transaction, TransactionType, PaymentStatus, RecurrenceFrequency, Attachment } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { calculateTransactionMetrics } from '../../utils/financialCalculations';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TransactionModal: React.FC = () => {
  const {
    isTxModalOpen,
    editingTx,
    closeTxModal,
    saveTransaction,
    deleteTransaction,
    categories,
    year,
    monthNumber,
  } = useFinancialData();

  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<TransactionType>('Pengeluaran');
  const [agendaTitle, setAgendaTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [pic, setPic] = useState<string>('');
  const [plannedAmountInput, setPlannedAmountInput] = useState<string>('');
  const [actualAmountInput, setActualAmountInput] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Planned');
  const [notes, setNotes] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('monthly');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Initialize form when editingTx or opening modal
  useEffect(() => {
    if (!isTxModalOpen) return;

    if (editingTx) {
      setDate(editingTx.transactionDate || '');
      setType(editingTx.transactionType || 'Pengeluaran');
      setAgendaTitle(editingTx.agendaTitle || '');
      setCategory(editingTx.category || '');
      setPic(editingTx.personInCharge || '');
      setPlannedAmountInput(editingTx.plannedAmount ? editingTx.plannedAmount.toString() : '');
      setActualAmountInput(editingTx.actualAmount ? editingTx.actualAmount.toString() : '');
      setPaymentStatus(editingTx.paymentStatus || 'Planned');
      setNotes(editingTx.notes || '');
      setReferenceNumber(editingTx.referenceNumber || '');
      setIsRecurring(!!editingTx.isRecurring);
      setRecurrenceFreq(editingTx.recurrenceFrequency || 'monthly');
      setAttachments(editingTx.attachments || []);
    } else {
      // Default to active year & month or current day
      const today = new Date();
      const currentMonthMatch = today.getFullYear() === year && today.getMonth() + 1 === monthNumber;
      const defaultDay = currentMonthMatch
        ? String(today.getDate()).padStart(2, '0')
        : '01';
      setDate(`${year}-${String(monthNumber).padStart(2, '0')}-${defaultDay}`);
      setType('Pengeluaran');
      setAgendaTitle('');
      setCategory('Tagihan');
      setPic('');
      setPlannedAmountInput('');
      setActualAmountInput('');
      setPaymentStatus('Planned');
      setNotes('');
      setReferenceNumber('');
      setIsRecurring(false);
      setRecurrenceFreq('monthly');
      setAttachments([]);
    }
  }, [isTxModalOpen, editingTx, year, monthNumber]);

  // Filter categories by type
  const availableCategories = categories.filter(c => c.transactionType === type);

  // Set default category if current category does not match type
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.some(c => c.categoryName === category)) {
      setCategory(availableCategories[0].categoryName);
    }
  }, [type, availableCategories, category]);

  // Live calculated preview
  const plannedNum = parseRupiahInput(plannedAmountInput);
  const actualNum = parseRupiahInput(actualAmountInput);
  const metrics = calculateTransactionMetrics(type, plannedNum, actualNum);

  if (!isTxModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Tanggal transaksi harus diisi.');
      return;
    }
    if (!agendaTitle.trim()) {
      alert('Judul agenda transaksi harus diisi.');
      return;
    }

    const payload: Partial<Transaction> & { transactionDate: string; agendaTitle: string; transactionType: any } = {
      ...(editingTx?.id ? { id: editingTx.id } : {}),
      transactionDate: date,
      transactionType: type,
      agendaTitle: agendaTitle.trim(),
      category: category || (type === 'Pengeluaran' ? 'Lainnya' : 'Pendapatan Lain'),
      personInCharge: pic.trim(),
      plannedAmount: plannedNum,
      actualAmount: actualNum,
      paymentStatus: paymentStatus,
      notes: notes.trim(),
      referenceNumber: referenceNumber.trim(),
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFreq : 'none',
      attachments,
    };

    const success = saveTransaction(payload);
    if (success) {
      closeTxModal();
    }
  };

  const handleDuplicate = () => {
    // Save as new transaction
    const payload = {
      transactionDate: date,
      transactionType: type,
      agendaTitle: `${agendaTitle} (Salinan)`,
      category,
      personInCharge: pic,
      plannedAmount: plannedNum,
      actualAmount: actualNum,
      paymentStatus,
      notes,
      referenceNumber: '',
      isRecurring: false,
      recurrenceFrequency: 'none' as RecurrenceFrequency,
      attachments,
    };
    saveTransaction(payload);
    closeTxModal();
  };

  const applyPreset = (presetName: string, presetType: TransactionType, defaultCategory: string) => {
    setType(presetType);
    setAgendaTitle(presetName);
    setCategory(defaultCategory);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        fileUrl: reader.result as string,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (attId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {editingTx?.id ? 'Edit Transaksi / Agenda' : 'Tambah Transaksi / Agenda Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              Sistem pencatatan multi-agenda, rencana anggaran, dan realisasi cashflow
            </p>
          </div>
          <button
            onClick={closeTxModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick Entry Presets */}
          {!editingTx?.id && (
            <div className="space-y-1.5 pb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Preset Entri Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('Tagihan Listrik & Air', 'Pengeluaran', 'Tagihan')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                >
                  ⚡ Tagihan
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Cicilan Bulanan', 'Pengeluaran', 'Cicilan')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                >
                  💳 Cicilan
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('BBM & Transportasi', 'Pengeluaran', 'Transportasi')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                >
                  🚗 Transportasi
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Belanja Makanan & Pantry', 'Pengeluaran', 'Makanan')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                >
                  🍱 Makanan
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Gaji Bulanan', 'Pemasukan', 'Gaji')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] text-emerald-300 border border-emerald-700/50"
                >
                  💰 Gajian
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Bonus Project', 'Pemasukan', 'Bonus')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] text-emerald-300 border border-emerald-700/50"
                >
                  🎁 Bonus
                </button>
              </div>
            </div>
          )}

          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setType('Pengeluaran')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'Pengeluaran'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pengeluaran (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType('Pemasukan')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'Pemasukan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan (Income)
            </button>
          </div>

          {/* Date & Agenda Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Transaksi <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategori <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.categoryName}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Judul Agenda / Deskripsi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tagihan Listrik PLN & Internet Kantor"
              value={agendaTitle}
              onChange={e => setAgendaTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Amounts: Planned & Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <label className="block text-xs font-semibold text-sky-300 mb-1">
                Nilai Rencana (Plan)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={plannedAmountInput}
                  onChange={e => {
                    const parsed = parseRupiahInput(e.target.value);
                    setPlannedAmountInput(parsed === 0 ? '' : parsed.toLocaleString('id-ID'));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Estimasi komitmen/forecast anggaran</p>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                Nilai Aktual (Realisasi)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={actualAmountInput}
                  onChange={e => {
                    const parsed = parseRupiahInput(e.target.value);
                    setActualAmountInput(parsed === 0 ? '' : parsed.toLocaleString('id-ID'));
                    // If actual entered > 0 and paymentStatus is planned, auto suggest paid
                    if (parsed > 0 && paymentStatus === 'Planned') {
                      setPaymentStatus('Paid');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Jumlah riil yang dibayar / diterima</p>
            </div>
          </div>

          {/* Live Validation & Calculation Preview Banner */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Varians:</span>
                <span className={`font-mono font-bold ${metrics.varianceAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(metrics.varianceAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Realisasi:</span>
                <span className="font-mono font-bold text-white">
                  {(metrics.realizationPercentage * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Status Evaluasi:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                metrics.status === 'Over Budget'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : metrics.status === 'On/Under Budget' || metrics.status === 'Diterima'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {metrics.status}
              </span>
            </div>
          </div>

          {/* PIC & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi (Admin), Finance, Pribadi"
                value={pic}
                onChange={e => setPic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Pembayaran
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Planned">Planned (Telah Direncanakan)</option>
                <option value="Due">Due (Jatuh Tempo)</option>
                <option value="Paid">Paid (Sudah Dibayar/Lunas)</option>
                <option value="Partially Paid">Partially Paid (Sebagian)</option>
                <option value="Rescheduled">Rescheduled (Dijadwalkan Ulang)</option>
                <option value="Cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                No. Referensi / Invoice / No. Resi
              </label>
              <input
                type="text"
                placeholder="Contoh: INV-2026-001"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Tambahan
              </label>
              <input
                type="text"
                placeholder="Catatan detail..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Recurrence Options */}
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-teal-500 focus:ring-teal-500"
                />
                <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                Jadikan Transaksi Berulang (Recurring)
              </label>

              {isRecurring && (
                <select
                  value={recurrenceFreq}
                  onChange={e => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="weekly">Setiap Minggu</option>
                  <option value="biweekly">Setiap 2 Minggu</option>
                  <option value="monthly">Setiap Bulan</option>
                  <option value="quarterly">Setiap Kuartal</option>
                  <option value="annually">Setiap Tahun</option>
                </select>
              )}
            </div>
          </div>

          {/* Attachment upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lampiran Dokumen / Bukti Bayar / Nota
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition">
                <Paperclip className="w-3.5 h-3.5 text-teal-400" />
                Unggah File / Nota (Maks 2MB)
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs"
                  >
                    <span className="truncate max-w-[200px] sm:max-w-xs">{att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {editingTx?.id && (
                <>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplikasi
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closeTxModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-md shadow-teal-500/20 active:scale-95 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Transaksi
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Hapus Transaksi?"
        message={`Apakah Anda yakin ingin menghapus transaksi "${agendaTitle}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Permanen"
        onConfirm={() => {
          if (editingTx?.id) {
            deleteTransaction(editingTx.id);
            setDeleteConfirmOpen(false);
            closeTxModal();
          }
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};
