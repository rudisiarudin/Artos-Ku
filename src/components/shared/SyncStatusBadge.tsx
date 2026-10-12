import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export function SyncStatusBadge() {
  const { isOnline, pendingSyncCount, refreshData } = useFinance();
  const [isSyncing, setIsSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshData();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tersinkron</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <WifiOff className="h-3.5 w-3.5" />
        <span>Mode Offline {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Menyinkronkan...</span>
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        title="Ada perubahan lokal yang belum tersinkron. Klik untuk sinkronkan."
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Sinkronkan ({pendingSyncCount})</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      title="Semua data tersinkron. Klik untuk cek pembaruan."
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 transition cursor-pointer"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Tersinkron</span>
    </button>
  );
}
