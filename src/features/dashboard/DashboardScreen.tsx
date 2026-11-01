import React, { useMemo } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  formatRupiah,
  formatRupiahCompact,
  formatPercentage,
  formatDateIndo,
  INDONESIAN_MONTHS,
} from '../../utils/formatters';
import {
  calculateRunningDailyBalances,
  calculateMonthlySummary,
} from '../../utils/financialCalculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

const COLORS = [
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

export const DashboardScreen: React.FC = () => {
  const {
    year,
    monthNumber,
    summary,
    transactions,
    monthTransactions,
    budgets,
  } = useFinancialData();

  // 1. 12-Month Comparison Data for Current Year
  const yearlyData = useMemo(() => {
    return INDONESIAN_MONTHS.map((name, idx) => {
      const mNum = idx + 1;
      const b = budgets.find(b => b.year === year && b.monthNumber === mNum);
      const mSummary = calculateMonthlySummary(year, mNum, b ? b.initialBudget : 0, transactions);
      return {
        month: name.slice(0, 3),
        fullName: name,
        budget: mSummary.initialMonthlyBudget,
        plan: mSummary.plannedExpense,
        aktual: mSummary.actualExpense,
        income: mSummary.actualIncome,
        sisa: mSummary.actualRemainingFunds,
        utilization: Math.round(mSummary.budgetUtilization * 100),
      };
    });
  }, [year, budgets, transactions]);

  // 2. Category Breakdown Data for current active month
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; planned: number; actual: number }>();

    monthTransactions.forEach(t => {
      if (t.transactionType === 'Pengeluaran') {
        const cat = t.category || 'Lainnya';
        const curr = map.get(cat) || { name: cat, planned: 0, actual: 0 };
        curr.planned += t.plannedAmount || 0;
        curr.actual += t.actualAmount || 0;
        map.set(cat, curr);
      }
    });

    const arr = Array.from(map.values()).sort((a, b) => b.actual - a.actual);
    return arr;
  }, [monthTransactions]);

  // 3. Daily Running Balance Cashflow Trend
  const dailyCashflowData = useMemo(() => {
    const balances = calculateRunningDailyBalances(
      year,
      monthNumber,
      summary.initialMonthlyBudget,
      monthTransactions
    );
    return balances.map(d => ({
      day: `${d.dayNumber}`,
      date: d.date,
      balance: d.runningBalance,
      income: d.income,
      expense: d.expense,
    }));
  }, [year, monthNumber, summary.initialMonthlyBudget, monthTransactions]);

  // 4. Top 5 Largest Transactions in active month
  const topTransactions = useMemo(() => {
    return [...monthTransactions]
      .filter(t => t.transactionType === 'Pengeluaran')
      .sort((a, b) => (b.actualAmount || b.plannedAmount) - (a.actualAmount || a.plannedAmount))
      .slice(0, 5);
  }, [monthTransactions]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-150">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Executive Dashboard Keuangan
            </h2>
            <p className="text-xs text-slate-400">
              Visualisasi tren cashflow tahun {year} & realisasi bulan {INDONESIAN_MONTHS[monthNumber - 1]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-teal-300 border border-slate-700 font-mono">
            Tahun {year}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Dana Tersedia</span>
          <div className="text-base sm:text-lg font-bold font-mono text-teal-300 truncate">
            {formatRupiah(summary.availableFunds)}
          </div>
          <span className="text-[10px] text-slate-500">Budget Awal + Uang Masuk</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Aktual Pengeluaran</span>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400 truncate">
            {formatRupiah(summary.actualExpense)}
          </div>
          <span className="text-[10px] text-slate-500">Plan: {formatRupiah(summary.plannedExpense)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Sisa Kas Riil</span>
          <div className={`text-base sm:text-lg font-bold font-mono truncate ${
            summary.actualRemainingFunds >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatRupiah(summary.actualRemainingFunds)}
          </div>
          <span className="text-[10px] text-slate-500">Kas bersih aktual</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Utilisasi Budget</span>
          <div className="text-base sm:text-lg font-bold font-mono text-purple-300 truncate">
            {formatPercentage(summary.budgetUtilization)}
          </div>
          <span className="text-[10px] text-slate-500">Status: {summary.status}</span>
        </div>
      </div>

      {/* 3. Main Chart: Budget vs Plan vs Actual per Month (12 Months) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Budget Awal vs Rencana (Plan) vs Realisasi Aktual ({year})
            </h3>
            <p className="text-xs text-slate-400">
              Evaluasi kinerja anggaran multi-bulan dari Januari hingga Desember
            </p>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickFormatter={val => formatRupiahCompact(val)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(value: any) => [formatRupiah(Number(value)), '']}
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="budget" name="Budget Awal" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="plan" name="Plan Keluar" fill="#818CF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aktual" name="Aktual Keluar" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two Column Analytics: Daily Cashflow Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cashflow Running Balance Trend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Tren Saldo Kas Harian (Running Daily Balance)
            </h3>
            <p className="text-xs text-slate-400">
              Pergerakan saldo kas kronologis bulan {INDONESIAN_MONTHS[monthNumber - 1]}
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCashflowData}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickFormatter={t => `Tgl ${t}`} />
                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={val => formatRupiahCompact(val)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Saldo Kas']}
                  labelFormatter={(lbl) => `Tanggal ${lbl} ${INDONESIAN_MONTHS[monthNumber - 1]}`}
                />
                <Area type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution (Donut / Pie) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-400" />
              Distribusi Pengeluaran Aktual per Kategori
            </h3>
            <p className="text-xs text-slate-400">
              Porsi anggaran belanja bulan {INDONESIAN_MONTHS[monthNumber - 1]}
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Belum ada transaksi pengeluaran pada bulan ini.
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col sm:flex-row items-center">
              <div className="w-full sm:w-1/2 h-48 sm:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="actual"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val: any) => [formatRupiah(Number(val)), 'Aktual']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-48 text-xs pr-2">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0 ml-2">
                      {formatRupiah(cat.actual, false)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Top 5 Largest Transactions & Money In vs Expense Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Money In vs Actual Expense per Month */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Perbandingan Uang Masuk vs Pengeluaran Riil
            </h3>
            <p className="text-xs text-slate-400">
              Cash inflow vs outflow sepanjang tahun {year}
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={val => formatRupiahCompact(val)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="income" name="Uang Masuk" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aktual" name="Pengeluaran Riil" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Largest Transactions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="mb-3 pb-3 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-white">
              Top 5 Pengeluaran Terbesar Bulan Ini
            </h3>
            <p className="text-xs text-slate-400">
              Transaksi dengan nilai pengeluaran tertinggi
            </p>
          </div>

          <div className="flex-1 space-y-2">
            {topTransactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Belum ada transaksi pengeluaran.
              </div>
            ) : (
              topTransactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{tx.agendaTitle}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateIndo(tx.transactionDate)} • {tx.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-rose-400">
                    {formatRupiah(tx.actualAmount || tx.plannedAmount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
