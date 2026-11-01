import React, { useState, useRef } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import { ExcelService, ImportValidationResult } from '../../services/excelService';
import { StorageService } from '../../services/storageService';
import { formatRupiah, formatDateIndo, INDONESIAN_MONTHS } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const ImportExportScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    summary,
    transactions,
    monthTransactions,
    budgets,
    refreshData,
    addToast,
    clearAllData,
  } = useFinancialData();

  // Excel / CSV Import preview state
  const [importResult, setImportResult] = useState<ImportValidationResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Clear data confirm
  const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);

  // Handle Excel/CSV file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSelectedFileName(file.name);
    try {
      const res = await ExcelService.parseFile(file, transactions);
      setImportResult(res);
    } catch (err: any) {
      addToast(`Gagal membaca file: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm import into database
  const handleConfirmImport = () => {
    if (!importResult || importResult.validRows.length === 0) return;

    importResult.validRows.forEach(row => {
      StorageService.saveTransaction(row as any);
    });

    refreshData();
    addToast(`${importResult.validRows.length} transaksi berhasil diimpor ke database!`, 'success');
    setImportResult(null);
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export Excel
  const handleExportExcel = () => {
    ExcelService.exportMonthlyExcel(summary, monthTransactions, budgets.filter(b => b.year === year));
    addToast('Laporan Excel (.xlsx) berhasil diunduh!', 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    ExcelService.exportTransactionsCSV(monthTransactions, `Transaksi_${year}_Bulan_${monthNumber}.csv`);
    addToast('File CSV berhasil diunduh!', 'success');
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_BudgetCal_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Backup data JSON berhasil diunduh!', 'success');
  };

  // Import JSON Restore
  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = StorageService.importAllData(reader.result as string);
      if (result.success) {
        refreshData();
        addToast(result.message, 'success');
      } else {
        addToast(result.message, 'error');
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  // Print PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Import, Export & Cadangan Data (Backup / Restore)
            </h2>
            <p className="text-xs text-slate-400">
              Sinkronisasi data Excel, CSV, format cetak PDF, dan pencadangan JSON
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Printer className="w-3.5 h-3.5 text-teal-400" />
          <span>Cetak / PDF</span>
        </button>
      </div>

      {/* 2. Export Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Export Excel Workbook */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Export Laporan Excel (.xlsx)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Mengunduh berkas workbook multi-sheet (Ringkasan Eksekutif, Daftar Transaksi, dan Budget Tahunan) bulan {INDONESIAN_MONTHS[monthNumber - 1]} {year}.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File Excel</span>
          </button>
        </div>

        {/* Card 2: Export CSV */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Export Data CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Ekspor seluruh data transaksi aktif dalam format CSV standar yang kompatibel dengan Google Sheets, Numbers, atau database SQL.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>
        </div>

        {/* Card 3: JSON Backup & Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Cadangan Lengkap (JSON)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Simpan seluruh data database lokal (budget multi-tahun, transaksi, hari libur, kategori, dan target tabungan) ke file JSON.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 text-center"
            >
              Unduh JSON
            </button>
            <label className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer text-center">
              Pulihkan JSON
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleJSONFileChange}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Excel Workbook / CSV Import Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-400" />
            Impor Transaksi dari Excel / CSV
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mendukung file Excel workbook (.xlsx, .xls) maupun CSV dari template Kalender Monitoring Budget.
          </p>
        </div>

        {/* Upload box */}
        <div className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/60 rounded-2xl p-6 text-center transition bg-slate-800/20">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            id="excel-file-input"
            onChange={handleFileChange}
          />
          <label htmlFor="excel-file-input" className="cursor-pointer space-y-2 block">
            <FileSpreadsheet className="w-10 h-10 text-teal-400 mx-auto stroke-[1.5]" />
            <div className="text-xs sm:text-sm font-semibold text-white">
              {selectedFileName ? selectedFileName : 'Pilih file Excel (.xlsx) atau CSV untuk diimpor'}
            </div>
            <p className="text-[11px] text-slate-400">
              Sistem akan memvalidasi kolom Tanggal, Tipe, Judul Agenda, Plan, dan Aktual sebelum menyimpan.
            </p>
          </label>
        </div>

        {/* Validation and Preview Results */}
        {importResult && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Hasil Validasi Berkas Impor
                </h4>
                <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                  <span className="text-emerald-400 font-semibold">
                    ✓ {importResult.validRows.length} data valid
                  </span>
                  {importResult.invalidRows.length > 0 && (
                    <span className="text-rose-400 font-semibold">
                      ✕ {importResult.invalidRows.length} data tidak valid
                    </span>
                  )}
                  {importResult.duplicateCount > 0 && (
                    <span className="text-amber-400 font-semibold">
                      ⚠ {importResult.duplicateCount} potensi duplikat terdeteksi
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFileName('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importResult.validRows.length === 0}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Impor ({importResult.validRows.length} Baris)
                </button>
              </div>
            </div>

            {/* Preview First 5 Valid Rows */}
            {importResult.validRows.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Pratinjau Data yang Akan Masuk:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {importResult.validRows.slice(0, 5).map((row, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-white font-sans font-semibold mr-2">{row.agendaTitle}</span>
                        <span className="text-[10px] text-slate-400 font-sans">{row.transactionDate} • {row.category}</span>
                      </div>
                      <div className="text-right">
                        <span className={row.transactionType === 'Pemasukan' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {row.transactionType === 'Pemasukan' ? '+' : '-'} {formatRupiah(row.actualAmount || row.plannedAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Rows if any */}
            {importResult.invalidRows.length > 0 && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Baris yang dilewati (tidak valid):
                </span>
                {importResult.invalidRows.slice(0, 3).map((err, idx) => (
                  <div key={idx} className="text-[11px]">
                    Baris #{err.rowNumber}: {err.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Danger Zone: Reset All Data */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Zona Bahaya: Reset & Bersihkan Seluruh Data
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Menghapus seluruh transaksi, alokasi budget, dan pengaturan dari peramban lokal.
          </p>
        </div>

        <button
          onClick={() => setClearDataConfirmOpen(true)}
          className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition self-start sm:self-auto"
        >
          Reset Semua Data
        </button>
      </div>

      <ConfirmDialog
        isOpen={clearDataConfirmOpen}
        title="Reset & Hapus Seluruh Data?"
        message="Tindakan ini akan mengosongkan seluruh database transaksi, budget bulanan, dan riwayat di browser Anda. Pastikan Anda telah mengunduh Backup JSON terlebih dahulu jika data masih diperlukan."
        confirmLabel="Ya, Bersihkan Semuanya"
        onConfirm={() => {
          clearAllData();
          setClearDataConfirmOpen(false);
        }}
        onCancel={() => setClearDataConfirmOpen(false)}
      />
    </div>
  );
};
