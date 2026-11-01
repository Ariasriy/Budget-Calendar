import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { Holiday, HolidayType } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_HOLIDAYS } from '../../services/defaultData';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const HolidayScreen: React.FC = () => {
  const { year, setYear, holidays, saveHoliday, deleteHoliday, addToast } = useFinancialData();

  // Filter holiday year
  const [filterYear, setFilterYear] = useState<number>(year);
  const [filterType, setFilterType] = useState<string>('all');

  // Modal Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Form states
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayType, setHolidayType] = useState<HolidayType>('Libur Nasional');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('SKB 3 Menteri RI');

  // Delete confirm
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter(h => {
        const matchesYear = filterYear === 0 || h.year === filterYear;
        const matchesType = filterType === 'all' || h.holidayType === filterType;
        return matchesYear && matchesType;
      })
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
  }, [holidays, filterYear, filterType]);

  const openAddModal = () => {
    setEditingHoliday(null);
    setHolidayDate(`${filterYear}-01-01`);
    setHolidayName('');
    setHolidayType('Libur Perusahaan');
    setDescription('');
    setSource('Internal Perusahaan');
    setModalOpen(true);
  };

  const openEditModal = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayDate(h.holidayDate);
    setHolidayName(h.holidayName);
    setHolidayType(h.holidayType);
    setDescription(h.description || '');
    setSource(h.source || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayName.trim()) {
      alert('Tanggal dan nama hari libur harus diisi.');
      return;
    }

    const hYear = parseInt(holidayDate.split('-')[0], 10);

    const payload: Holiday = {
      id: editingHoliday?.id || `h-${holidayDate}-${Date.now()}`,
      holidayDate,
      holidayName: holidayName.trim(),
      holidayType,
      year: hYear,
      description: description.trim(),
      source: source.trim() || 'Internal',
      createdAt: editingHoliday?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveHoliday(payload);
    setModalOpen(false);
  };

  const handleResetStandard = () => {
    DEFAULT_HOLIDAYS.forEach(h => saveHoliday(h));
    addToast('Data Hari Libur & Cuti Bersama standar berhasil dimuat ulang!', 'success');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Hari Libur Nasional, Cuti Bersama & Perusahaan
            </h2>
            <p className="text-xs text-slate-400">
              Data libur ditampilkan secara otomatis pada kalender monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetStandard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Muat ulang hari libur nasional resmi SKB 3 Menteri"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Muat Ulang SKB</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Libur</span>
          </button>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Tahun:</span>
          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value, 10))}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
          >
            <option value={0}>Semua Tahun</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Jenis:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
          >
            <option value="all">Semua Jenis</option>
            <option value="Libur Nasional">Libur Nasional</option>
            <option value="Cuti Bersama">Cuti Bersama</option>
            <option value="Libur Perusahaan">Libur Perusahaan</option>
            <option value="Hari Kerja Pengganti">Hari Kerja Pengganti</option>
          </select>
        </div>

        <div className="ml-auto text-slate-400 font-mono">
          Total: <strong>{filteredHolidays.length}</strong> hari libur
        </div>
      </div>

      {/* 3. Holidays Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredHolidays.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
            Tidak ada data hari libur yang cocok dengan filter.
          </div>
        ) : (
          filteredHolidays.map(h => (
            <div
              key={h.id}
              onClick={() => openEditModal(h)}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.holidayType === 'Libur Nasional'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : h.holidayType === 'Cuti Bersama'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : h.holidayType === 'Libur Perusahaan'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {h.holidayType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {formatDateIndo(h.holidayDate)}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{h.holidayName}</h4>
                {h.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{h.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500" onClick={e => e.stopPropagation()}>
                <span>Sumber: {h.source || 'Kalender RI'}</span>
                <button
                  onClick={() => setDeletingHoliday(h)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Holiday Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
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
                  Tanggal Libur <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Hari Libur / Agenda <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Libur Ulang Tahun Perusahaan"
                  value={holidayName}
                  onChange={e => setHolidayName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jenis Libur
                </label>
                <select
                  value={holidayType}
                  onChange={e => setHolidayType(e.target.value as HolidayType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Libur Nasional">Libur Nasional</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                  <option value="Libur Perusahaan">Libur Perusahaan</option>
                  <option value="Hari Kerja Pengganti">Hari Kerja Pengganti</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sumber Data / Dasar Keputusan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SK Direksi No 12/2026"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingHoliday}
        title="Hapus Hari Libur?"
        message={`Hapus ${deletingHoliday?.holidayName} (${deletingHoliday?.holidayDate})?`}
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deletingHoliday) {
            deleteHoliday(deletingHoliday.id);
            setDeletingHoliday(null);
          }
        }}
        onCancel={() => setDeletingHoliday(null)}
      />
    </div>
  );
};
