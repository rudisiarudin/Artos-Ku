import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { cn } from '../../lib/utils';

export function SyncStatusBadge() {
  const { isOnline, pendingSyncCount, refreshData } = useFinance();

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <WifiOff className="h-3.5 w-3.5" />
        <span>Mode Offline ({pendingSyncCount} tertunda)</span>
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <button
        onClick={() => refreshData()}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Menyinkronkan ({pendingSyncCount})</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Tersinkron</span>
    </div>
  );
}
