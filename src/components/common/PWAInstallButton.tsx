import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition border border-teal-400/30 active:scale-95"
        title="Instal aplikasi ke perangkat Anda (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                  Instal di iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Untuk memasang aplikasi ini sebagai Progressive Web App di iOS:
              </p>
              <ol className="mt-2 text-xs text-slate-200 space-y-2 list-decimal list-inside bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
                <li>Buka Safari lalu ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas di toolbar bawah).</li>
                <li>Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama</strong> (Add to Home Screen).</li>
                <li>Ketuk <strong>Tambah</strong> di sudut kanan atas.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-500 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
