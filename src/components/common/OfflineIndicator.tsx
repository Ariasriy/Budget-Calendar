import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-18 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-300 backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4 text-slate-900" />
      <span>Mode Offline — Data tersimpan secara lokal di perangkat Anda.</span>
    </div>
  );
};
