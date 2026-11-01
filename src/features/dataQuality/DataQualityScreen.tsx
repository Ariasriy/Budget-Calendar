import React from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DataQualityIssue } from '../../types';

export const DataQualityScreen: React.FC = () => {
  const {
    issues,
    setActiveTab,
    refreshData,
    summary,
    year,
    monthNumber,
  } = useFinancialData();

  const criticalIssues = issues.filter(i => i.severity === 'Critical');
  const warningIssues = issues.filter(i => i.severity === 'Warning');
  const infoIssues = issues.filter(i => i.severity === 'Info');

  const getSeverityBadge = (severity: DataQualityIssue['severity']) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" /> Kritis
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Peringatan
          </span>
        );
      case 'Info':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <Info className="w-3 h-3 text-sky-400" /> Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Cek Integritas & Kualitas Data (Data Quality Audit)
            </h2>
            <p className="text-xs text-slate-400">
              Audit otomatis 15 parameter integritas data keuangan & anggaran
            </p>
          </div>
        </div>

        <button
          onClick={refreshData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
          <span>Audit Ulang Data</span>
        </button>
      </div>

      {/* 2. Overview Audit Status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block mb-1">Total Masalah Terdeteksi</span>
          <span className="text-2xl font-bold font-mono text-white">{issues.length}</span>
          <p className="text-[10px] text-slate-500 mt-1">Audit aktif {year} - Bln {monthNumber}</p>
        </div>
        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl">
          <span className="text-rose-400 block mb-1">Masalah Kritis (Critical)</span>
          <span className="text-2xl font-bold font-mono text-rose-400">{criticalIssues.length}</span>
          <p className="text-[10px] text-slate-500 mt-1">Perlu perbaikan segera</p>
        </div>
        <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-2xl">
          <span className="text-amber-400 block mb-1">Peringatan (Warning)</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{warningIssues.length}</span>
          <p className="text-[10px] text-slate-500 mt-1">Over-budget / selisih rencana</p>
        </div>
        <div className="bg-slate-900 border border-sky-900/40 p-4 rounded-2xl">
          <span className="text-sky-400 block mb-1">Informasi (Info)</span>
          <span className="text-2xl font-bold font-mono text-sky-400">{infoIssues.length}</span>
          <p className="text-[10px] text-slate-500 mt-1">Kelengkapan data umum</p>
        </div>
      </div>

      {/* 3. Issues List */}
      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="p-8 sm:p-12 bg-slate-900 border border-emerald-500/40 rounded-3xl text-center space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Semua Data Valid & Konsisten!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tidak ditemukan transaksi tanpa judul, nilai negatif, duplikasi budget, atau ketidaksesuaian kategori.
            </p>
          </div>
        ) : (
          issues.map(issue => (
            <div
              key={issue.id}
              className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm bg-slate-900 ${
                issue.severity === 'Critical'
                  ? 'border-rose-500/40'
                  : issue.severity === 'Warning'
                  ? 'border-amber-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {issue.affectedCount} data terdampak
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>
                  <p className="text-xs text-teal-300 font-medium">
                    💡 Rekomendasi Solusi: {issue.recommendedAction}
                  </p>
                </div>

                {issue.linkTab && (
                  <button
                    onClick={() => setActiveTab(issue.linkTab!)}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Perbaiki Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
