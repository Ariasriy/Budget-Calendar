import React, { useState } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  Home,
  Calendar,
  Plus,
  BarChart3,
  Menu,
  Receipt,
  Wallet,
  PieChart,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  PiggyBank,
  X,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, openTxModal, issues, loadDemoData, removeDemoData } = useFinancialData();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const moreItems = [
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'budget', label: 'Budget Bulanan', icon: Wallet },
    { id: 'analysis', label: 'Analisis Kategori', icon: PieChart },
    { id: 'goals', label: 'Target Tabungan', icon: PiggyBank },
    { id: 'holidays', label: 'Hari Libur & Cuti', icon: CalendarDays },
    {
      id: 'data-quality',
      label: 'Cek Data',
      icon: CheckCircle2,
      badge: issues.length > 0 ? issues.length : undefined,
    },
    { id: 'import-export', label: 'Import & Export', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-1.5 safe-area-bottom">
        <div className="flex items-center justify-around relative">
          {/* 1. Home */}
          <button
            onClick={() => handleSelectTab('home')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'home' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* 2. Kalender */}
          <button
            onClick={() => handleSelectTab('calendar')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'calendar' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Kalender</span>
          </button>

          {/* 3. Center Prominent Tambah Action Button */}
          <div className="relative -top-4">
            <button
              onClick={() => openTxModal()}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 border-4 border-slate-900 active:scale-95 transition"
              aria-label="Tambah Transaksi"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Dashboard */}
          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          {/* 5. Lainnya */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition ${
              ['transactions', 'budget', 'analysis', 'goals', 'holidays', 'data-quality', 'import-export'].includes(activeTab)
                ? 'text-teal-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Lainnya</span>
            {issues.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>
        </div>
      </nav>

      {/* Slide-up "Lainnya" Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
          <div className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Menu Lainnya</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition ${
                      isActive
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Demo Controls in Drawer */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Data Percontohan (Demo)
                </span>
                <button
                  onClick={() => {
                    removeDemoData();
                    setDrawerOpen(false);
                  }}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Bersihkan
                </button>
              </div>
              <button
                onClick={() => {
                  loadDemoData();
                  setDrawerOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
              >
                Muat Contoh Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
