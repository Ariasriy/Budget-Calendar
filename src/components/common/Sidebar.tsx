import React from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  Home,
  Calendar,
  Receipt,
  BarChart3,
  Wallet,
  PieChart,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  PiggyBank,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, issues, loadDemoData, removeDemoData } = useFinancialData();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'budget', label: 'Budget Bulanan', icon: Wallet },
    { id: 'analysis', label: 'Analisis Kategori', icon: PieChart },
    { id: 'goals', label: 'Target Tabungan', icon: PiggyBank },
    { id: 'holidays', label: 'Hari Libur & Cuti', icon: CalendarDays },
    {
      id: 'data-quality',
      label: 'Cek Data',
      icon: CheckCircle2,
      badge: issues.length > 0 ? issues.length : undefined,
      badgeColor: issues.some(i => i.severity === 'Critical') ? 'bg-rose-500' : 'bg-amber-500',
    },
    { id: 'import-export', label: 'Import / Export', icon: FileSpreadsheet },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-4 shrink-0 select-none min-h-[calc(100vh-61px)]">
      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/15 to-sky-500/10 text-teal-300 border border-teal-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black text-white ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Data Quick Controls */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
          <p className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Data Percobaan (Demo)
          </p>
          <p className="text-[10px] text-slate-400 leading-normal mb-2.5">
            Muat contoh transaksi lengkap untuk menguji sistem kalender & grafik.
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={loadDemoData}
              className="flex-1 py-1.5 px-2 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-white text-[10px] font-bold transition text-center"
            >
              Muat Demo
            </button>
            <button
              onClick={removeDemoData}
              className="py-1.5 px-2 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-rose-300 text-[10px] font-semibold transition"
              title="Bersihkan Data Demo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
          BudgetCal v7.0 • PWA Ready
        </div>
      </div>
    </aside>
  );
};
