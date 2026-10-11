'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  RotateCcw,
  Tag,
  Palette,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Eye,
  EyeOff,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  User,
  LogOut,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useFinance } from '../../context/FinanceContext';
import { isSupabaseConfigured } from '../../lib/db/supabase';
import { storage } from '../../lib/db/storage';
import { CategoryType } from '../../lib/db/types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  getTelegramConfig,
  saveTelegramConfig,
  sendTelegramNotification,
  TelegramConfig,
} from '../../lib/services/telegram';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { categories, saveCategory, resetDemoData, refreshData, user, logout, resetOnboarding } = useFinance();

  const [supabaseConnected] = useState(isSupabaseConfigured());
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryType>('expense');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [statusMessage, setStatusMessage] = useState('');

  // Telegram Bot State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    isEnabled: false,
    notifyDebts: true,
    notifyBudgets: true,
    notifyDailySummary: false,
  });
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  useEffect(() => {
    const saved = getTelegramConfig();
    setTelegramConfig(saved);
  }, []);

  // Handle Export JSON
  const handleExportJSON = async () => {
    const jsonStr = await storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artosku_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('Backup data berhasil diunduh!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Handle Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.accounts) await storage.setCollection('artosku_accounts', parsed.accounts);
        if (parsed.categories) await storage.setCollection('artosku_categories', parsed.categories);
        if (parsed.transactions)
          await storage.setCollection('artosku_transactions', parsed.transactions);
        if (parsed.assets) await storage.setCollection('artosku_assets', parsed.assets);
        if (parsed.trades) await storage.setCollection('artosku_trades', parsed.trades);
        if (parsed.receivables)
          await storage.setCollection('artosku_receivables', parsed.receivables);
        if (parsed.debts) await storage.setCollection('artosku_debts', parsed.debts);
        if (parsed.budgets) await storage.setCollection('artosku_budgets', parsed.budgets);
        if (parsed.reminders) await storage.setCollection('artosku_reminders', parsed.reminders);

        await refreshData();
        setStatusMessage('Data berhasil dipulihkan dari file backup!');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch {
        alert('File JSON tidak valid atau rusak');
      }
    };
    reader.readAsText(file);
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await saveCategory({
      id: `cat_${Date.now()}`,
      user_id: 'default-user',
      name: newCatName.trim(),
      type: newCatType,
      icon: 'Tag',
      color: newCatColor,
      is_system: false,
      created_at: new Date().toISOString(),
    });

    setNewCatName('');
    setStatusMessage(`Kategori "${newCatName}" berhasil ditambahkan!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Handle Save Telegram
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    const isNowEnabled = Boolean(telegramConfig.botToken.trim() && telegramConfig.chatId.trim());
    const updated = {
      ...telegramConfig,
      isEnabled: isNowEnabled,
    };
    setTelegramConfig(updated);
    saveTelegramConfig(updated);
    setStatusMessage('Konfigurasi Telegram Bot berhasil disimpan!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Handle Test Telegram
  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken.trim() || !telegramConfig.chatId.trim()) {
      setTelegramTestResult({
        success: false,
        message: 'Mohon isi Bot Token dan Chat ID terlebih dahulu sebelum melakukan uji coba.',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const res = await sendTelegramNotification(
        telegramConfig.botToken.trim(),
        telegramConfig.chatId.trim(),
        ''
      );

      if (res.success) {
        setTelegramTestResult({
          success: true,
          message: 'Berhasil! Pesan uji coba telah dikirim ke akun Telegram Anda. Silakan cek aplikasi Telegram Anda.',
        });
        const updated = {
          ...telegramConfig,
          isEnabled: true,
          lastTestedAt: new Date().toISOString(),
        };
        setTelegramConfig(updated);
        saveTelegramConfig(updated);
      } else {
        setTelegramTestResult({
          success: false,
          message: res.message,
        });
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err?.message || 'Gagal menghubungi endpoint Telegram.',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">Pengaturan Aplikasi</h2>
        <p className="text-xs text-muted-foreground">
          Konfigurasi tema, database Supabase, kategori, dan pencadangan data
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-2xl bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {statusMessage}
        </div>
      )}

      {/* User Account & Sesi Pengguna */}
      <Card className="p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Akun & Sesi Pengguna</h3>
              <p className="text-xs text-muted-foreground">
                {user ? `Masuk sebagai: ${user.email}` : 'Belum masuk ke akun'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetOnboarding}
              className="gap-1.5 text-xs rounded-xl"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ulangi Onboarding</span>
            </Button>

            {user ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-xs rounded-xl"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar (Logout)</span>
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" className="gap-1.5 text-xs rounded-xl font-bold">
                  <User className="h-3.5 w-3.5" />
                  <span>Masuk ke Akun</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Database Connection Status */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Integrasi Database Supabase</h3>
            <p className="text-xs text-muted-foreground">
              {supabaseConnected
                ? 'Terhubung dengan PostgreSQL Supabase dan Row Level Security (RLS).'
                : 'Beroperasi dalam Mode Offline & IndexedDB Caching (Semua fitur tetap aktif dan siap disinkronkan).'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
          {supabaseConnected ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Status: Koneksi Supabase Aktif</span>
            </div>
          ) : (
            <div>
              <p>
                Untuk menghubungkan ke project remote Supabase Anda, atur variabel lingkungan berikut di{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code>:
              </p>
              <pre className="mt-2 rounded-lg bg-background p-2.5 font-mono text-[11px] text-foreground border border-border">
                NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* Integrasi Bot Telegram */}
      <Card className="p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Integrasi Bot Telegram</h3>
                {telegramConfig.isEnabled && telegramConfig.botToken ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Terhubung
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Belum Terhubung
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Kirim notifikasi jatuh tempo cicilan, peringatan batas anggaran, dan ringkasan keuangan harian ke chat Telegram.
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Form */}
        <form onSubmit={handleSaveTelegram} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">
                HTTP API Bot Token
              </label>
              <div className="relative mt-1">
                <Input
                  type={showTelegramToken ? 'text' : 'password'}
                  placeholder="Contoh: 123456789:ABCdefGhIjkLmNoPqRsT"
                  value={telegramConfig.botToken}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, botToken: e.target.value })
                  }
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowTelegramToken(!showTelegramToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showTelegramToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Didapatkan dari akun resmi <span className="font-semibold text-foreground">@BotFather</span> di Telegram.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">
                Telegram Chat ID
              </label>
              <div className="mt-1">
                <Input
                  type="text"
                  placeholder="Contoh: 123456789 atau -100123456789"
                  value={telegramConfig.chatId}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, chatId: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ID pengguna / grup Anda. Bisa dicek lewat bot <span className="font-semibold text-foreground">@userinfobot</span>.
              </p>
            </div>
          </div>

          {/* Notification Options */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-foreground block">
              Jenis Peringatan & Notifikasi Otomatis
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={telegramConfig.notifyDebts}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, notifyDebts: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Jatuh Tempo Cicilan & Piutang</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={telegramConfig.notifyBudgets}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, notifyBudgets: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Alert Batas Anggaran (&gt;80%)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={telegramConfig.notifyDailySummary}
                  onChange={(e) =>
                    setTelegramConfig({
                      ...telegramConfig,
                      notifyDailySummary: e.target.checked,
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Ringkasan Harian (Daily Brief)</span>
              </label>
            </div>
          </div>

          {/* Test Feedback Message */}
          {telegramTestResult && (
            <div
              className={`rounded-xl p-3.5 text-xs font-medium ${
                telegramTestResult.success
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {telegramTestResult.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" className="gap-2 font-bold shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Konfigurasi Bot</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram}
              className="gap-2"
            >
              {isTestingTelegram ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Send className="h-3.5 w-3.5 text-sky-500" />
              )}
              <span>{isTestingTelegram ? 'Menguji Koneksi...' : 'Kirim Pesan Uji Coba (Test)'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setShowTelegramGuide(!showTelegramGuide)}
              className="sm:ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{showTelegramGuide ? 'Tutup Panduan' : 'Panduan Membuat Bot (1 Menit)'}</span>
            </button>
          </div>
        </form>

        {/* Collapsible Step-by-Step Guide */}
        {showTelegramGuide && (
          <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-foreground space-y-2.5 animate-in fade-in">
            <h4 className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <span>📖 Langkah Praktis Menghubungkan Bot Telegram:</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
              <li>
                Buka aplikasi Telegram dan cari akun resmi{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-foreground underline inline-flex items-center gap-0.5"
                >
                  @BotFather <ExternalLink className="h-3 w-3" />
                </a>.
              </li>
              <li>
                Kirim pesan <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">/newbot</code> lalu ikuti instruksi (masukkan nama bot dan username berakhiran <code className="font-mono">bot</code>, misal: <code className="font-mono">ArtoskuFinanceBot</code>).
              </li>
              <li>
                Salin <b>HTTP API Token</b> yang diberikan (berbentuk deretan angka dan huruf seperti <code className="font-mono">7123456789:AAH...</code>) lalu tempel ke kolom <b>HTTP API Bot Token</b> di atas.
              </li>
              <li>
                Buka bot baru Anda di Telegram, lalu klik tombol <b>START</b> (<code className="font-mono">/start</code>). Langkah ini wajib dilakukan agar bot memiliki izin mengirim pesan ke Anda.
              </li>
              <li>
                Cari akun{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-foreground underline inline-flex items-center gap-0.5"
                >
                  @userinfobot <ExternalLink className="h-3 w-3" />
                </a>{' '}
                di Telegram, kirim pesan apa saja, lalu salin angka <b>Id</b> Anda ke kolom <b>Telegram Chat ID</b> di atas.
              </li>
              <li>
                Klik tombol <b>Kirim Pesan Uji Coba</b> untuk memastikan bot berhasil mengirim pesan konfirmasi ke chat Anda!
              </li>
            </ol>
          </div>
        )}
      </Card>

      {/* Appearance & Theme */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tema Tampilan</h3>
            <p className="text-xs text-muted-foreground">Pilih mode tampilan gelap atau terang</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            Light Mode
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            Dark Mode
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
          >
            Sistem
          </Button>
        </div>
      </Card>

      {/* Manage Categories */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Kategori Transaksi</h3>
            <p className="text-xs text-muted-foreground">
              Total {categories.length} kategori aktif
            </p>
          </div>
        </div>

        {/* Add custom category */}
        <form onSubmit={handleAddCategory} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            placeholder="Nama Kategori Baru"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
          />

          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as CategoryType)}
            className="rounded-xl border border-border bg-background p-2.5 text-xs outline-none"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>

          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded-xl border border-border bg-background p-1"
          />

          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
          >
            Tambah
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: c.color || '#10B981' }}
              />
              {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
            </span>
          ))}
        </div>
      </Card>

      {/* Data Backup & Reset */}
      <Card className="p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Pencadangan & Pemulihan Data</h3>
        <p className="text-xs text-muted-foreground">
          Ekspor semua data finansial ke JSON atau pulihkan dari cadangan sebelumnya
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor Semua Data (JSON)</span>
          </Button>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground">
            <Upload className="h-4 w-4" />
            <span>Impor Cadangan (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke pengaturan awal?')) {
                resetDemoData();
              }
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset ke Pengaturan Awal</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
