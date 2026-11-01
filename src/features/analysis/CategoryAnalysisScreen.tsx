import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  formatPercentage,
  INDONESIAN_MONTHS,
} from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import { Transaction } from '../../types';

const PALETTE = [
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#EF4444',
  '#14B8A6',
  '#6366F1',
  '#E11D48',
  '#64748B',
];

export const CategoryAnalysisScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    monthTransactions,
    transactions,
    summary,
    openTxModal,
  } = useFinancialData();

  // Selected category for drill-down modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Previous month transactions for MoM trend comparison
  const prevMonthNum = monthNumber === 1 ? 12 : monthNumber - 1;
  const prevYear = monthNumber === 1 ? year - 1 : year;
  const prevMonthPrefix = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;
  const prevMonthTxs = useMemo(() => {
    return transactions.filter(t => t.transactionDate.startsWith(prevMonthPrefix));
  }, [transactions, prevMonthPrefix]);

  // Aggregate category metrics
  const categoryAnalysis = useMemo(() => {
    const map = new Map<
      string,
      {
        categoryName: string;
        planned: number;
        actual: number;
        variance: number;
        txCount: number;
        prevActual: number;
        txs: Transaction[];
      }
    >();

    // Current month expenses
    monthTransactions.forEach(t => {
      if (t.transactionType === 'Pengeluaran') {
        const cat = t.category || 'Lainnya';
        const entry = map.get(cat) || {
          categoryName: cat,
          planned: 0,
          actual: 0,
          variance: 0,
          txCount: 0,
          prevActual: 0,
          txs: [],
        };
        entry.planned += t.plannedAmount || 0;
        entry.actual += t.actualAmount || 0;
        entry.txCount += 1;
        entry.txs.push(t);
        map.set(cat, entry);
      }
    });

    // Previous month expenses for MoM
    prevMonthTxs.forEach(t => {
      if (t.transactionType === 'Pengeluaran') {
        const cat = t.category || 'Lainnya';
        if (map.has(cat)) {
          map.get(cat)!.prevActual += t.actualAmount || 0;
        }
      }
    });

    const totalActualExpense = summary.actualExpense || 1;

    const list = Array.from(map.values()).map(item => {
      const variance = item.planned - item.actual;
      let status = 'Belum Aktual';
      if (item.actual === 0) status = 'Belum Aktual';
      else if (item.actual <= item.planned) status = 'On/Under Budget';
      else status = 'Over Budget';

      const share = item.actual / totalActualExpense;
      const momChange = item.prevActual === 0 ? 0 : (item.actual - item.prevActual) / item.prevActual;

      return {
        ...item,
        variance,
        status,
        share,
        momChange,
      };
    });

    // Sort by highest actual expense
    return list.sort((a, b) => b.actual - a.actual);
  }, [monthTransactions, prevMonthTxs, summary.actualExpense]);

  // Drilldown transactions for selected category
  const drilldownTxs = useMemo(() => {
    if (!selectedCategory) return [];
    const found = categoryAnalysis.find(c => c.categoryName === selectedCategory);
    return found ? found.txs : [];
  }, [selectedCategory, categoryAnalysis]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Analisis Pengeluaran per Kategori
            </h2>
            <p className="text-xs text-slate-400">
              Evaluasi alokasi, varians belanja, dan tren bulanan ({INDONESIAN_MONTHS[monthNumber - 1]} {year})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Total Pengeluaran Bulan Ini:</span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
            {formatRupiah(summary.actualExpense)}
          </span>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned vs Actual Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            Plan vs Realisasi Aktual per Kategori
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Komparasi anggaran komitmen dengan nilai riil yang dikeluarkan
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAnalysis.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="categoryName" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={val => `${Math.round(val / 1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="planned" name="Plan" fill="#818CF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Aktual" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share of Expense Donut Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-teal-400" />
            Porsi Kategori Terhadap Total Pengeluaran (Share of Wallet)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Persentase kontribusi setiap pos belanja
          </p>

          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryAnalysis}
                  dataKey="actual"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatRupiah(Number(val)), 'Aktual']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Category Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Tabel Realisasi Kategori & Status
            </h3>
            <p className="text-xs text-slate-400">
              Klik nama kategori untuk melihat detail transaksi (Drill-Down)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori Belanja</th>
                <th className="py-3 px-4 text-right">Rencana (Plan)</th>
                <th className="py-3 px-4 text-right">Aktual</th>
                <th className="py-3 px-4 text-right">Varians</th>
                <th className="py-3 px-4 text-right">Porsi (%)</th>
                <th className="py-3 px-4 text-center">Jml Tx</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {categoryAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Belum ada data pengeluaran pada bulan ini.
                  </td>
                </tr>
              ) : (
                categoryAnalysis.map((item, idx) => (
                  <tr
                    key={item.categoryName}
                    onClick={() => setSelectedCategory(item.categoryName)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                        />
                        <span className="font-bold text-white">{item.categoryName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sky-400">
                      {formatRupiah(item.planned)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {formatRupiah(item.actual)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={item.variance >= 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                        {formatRupiah(item.variance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatPercentage(item.share)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {item.txCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Over Budget'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.status === 'On/Under Budget'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1">
                        Lihat <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Drill-down Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-teal-400">Drill-Down Transaksi</span>
                <h3 className="text-base font-bold text-white">Kategori: {selectedCategory}</h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-3">
              {drilldownTxs.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedCategory(null);
                    openTxModal(t);
                  }}
                  className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{t.agendaTitle}</div>
                    <div className="text-[10px] text-slate-400">
                      {t.transactionDate} • PIC: {t.personInCharge || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400 block">
                      {formatRupiah(t.actualAmount || t.plannedAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedCategory(null)}
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
