/**
 * Budget Calendar & Cashflow Monitoring
 * Progressive Web Application
 */

import React from 'react';
import { FinancialProvider, useFinancialData } from './context/FinancialContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { TransactionModal } from './components/forms/TransactionModal';

// Feature screens
import { HomeScreen } from './features/home/HomeScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { TransactionListScreen } from './features/transactions/TransactionListScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { MonthlyBudgetScreen } from './features/budget/MonthlyBudgetScreen';
import { CategoryAnalysisScreen } from './features/analysis/CategoryAnalysisScreen';
import { HolidayScreen } from './features/holidays/HolidayScreen';
import { DataQualityScreen } from './features/dataQuality/DataQualityScreen';
import { SavingsGoalsScreen } from './features/goals/SavingsGoalsScreen';
import { ImportExportScreen } from './features/importExport/ImportExportScreen';

const MainContent: React.FC = () => {
  const { activeTab } = useFinancialData();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'transactions':
        return <TransactionListScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'budget':
        return <MonthlyBudgetScreen />;
      case 'analysis':
        return <CategoryAnalysisScreen />;
      case 'goals':
        return <SavingsGoalsScreen />;
      case 'holidays':
        return <HolidayScreen />;
      case 'data-quality':
        return <DataQualityScreen />;
      case 'import-export':
        return <ImportExportScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Header Toolbar */}
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* 2. Desktop Sidebar Navigation */}
        <Sidebar />

        {/* 3. Main Screen Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
          {renderActiveScreen()}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <MobileNav />

      {/* 5. Global Modals & Notifications */}
      <TransactionModal />
      <ToastContainer />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <FinancialProvider>
      <MainContent />
    </FinancialProvider>
  );
}
