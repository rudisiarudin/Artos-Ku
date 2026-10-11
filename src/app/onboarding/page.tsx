'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Target,
  PieChart,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../lib/db/types';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatIDR } from '../../lib/finance/formatters';

interface WalletPreset {
  name: string;
  institution: string;
  type: AccountType;
  color: string;
}

const WALLET_PRESETS: WalletPreset[] = [
  { name: 'BCA Tahapan Utama', institution: 'Bank Central Asia (BCA)', type: 'bank', color: '#005E9E' },
  { name: 'Mandiri Tabungan Now', institution: 'Bank Mandiri', type: 'bank', color: '#002D62' },
  { name: 'BRI BritAma', institution: 'Bank BRI', type: 'bank', color: '#00529B' },
  { name: 'GoPay Saldo Harian', institution: 'GoTo Financial', type: 'ewallet', color: '#00AA13' },
  { name: 'DANA Dompet Digital', institution: 'DANA Indonesia', type: 'ewallet', color: '#118EEA' },
  { name: 'OVO Cash', institution: 'OVO', type: 'ewallet', color: '#4C3494' },
  { name: 'Dompet Fisik Tunai', institution: 'Cash on Hand', type: 'cash', color: '#10B981' },
];

const QUICK_AMOUNTS = [
  { label: 'Rp 0', value: 0 },
  { label: 'Rp 500rb', value: 500000 },
  { label: 'Rp 1 Juta', value: 1000000 },
  { label: 'Rp 5 Juta', value: 5000000 },
  { label: 'Rp 10 Juta', value: 10000000 },
];

const COLOR_OPTIONS = [
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Royal Blue', hex: '#005E9E' },
  { label: 'Mandiri Navy', hex: '#002D62' },
  { label: 'Purple Gem', hex: '#8B5CF6' },
  { label: 'Amber Sun', hex: '#F59E0B' },
  { label: 'Rose Passion', hex: '#E11D48' },
  { label: 'Dark Stealth', hex: '#18181B' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useFinance();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: User Profile & Goals
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || 'Budi Santoso'
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'expense_tracking',
    'budgeting',
  ]);

  // Step 2: First Wallet Setup
  const [walletName, setWalletName] = useState('BCA Tahapan Utama');
  const [walletType, setWalletType] = useState<AccountType>('bank');
  const [institutionName, setInstitutionName] = useState('Bank Central Asia (BCA)');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(5000000);
  const [balanceInput, setBalanceInput] = useState<string>('5000000');
  const [walletColor, setWalletColor] = useState('#005E9E');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleApplyPreset = (preset: WalletPreset) => {
    setWalletName(preset.name);
    setInstitutionName(preset.institution);
    setWalletType(preset.type);
    setWalletColor(preset.color);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = Number(rawVal) || 0;
    setOpeningBalance(num);
    setBalanceInput(rawVal);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const newAccount: Account = {
        id: `acc_init_${Date.now()}`,
        user_id: user?.id || 'default-user',
        name: walletName.trim() || 'Dompet Utama',
        type: walletType,
        account_number: accountNumber.trim() || null,
        institution_name: institutionName.trim() || null,
        currency: 'IDR',
        opening_balance: openingBalance,
        current_balance: openingBalance,
        color: walletColor,
        is_active: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await completeOnboarding(newAccount);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 selection:bg-primary/20">
      <div className="w-full max-w-xl space-y-6">
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" showText={true} />
          <h1 className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
            Selamat Datang di ArtosKu
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Setup akun & dompet pertama Anda dalam waktu kurang dari 1 menit
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6 flex w-full items-center justify-between gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20'
                      : step > s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex w-full justify-between text-[11px] font-semibold text-muted-foreground">
            <span className={step === 1 ? 'text-primary font-bold' : ''}>1. Profil</span>
            <span className={step === 2 ? 'text-primary font-bold' : ''}>2. Dompet Pertama</span>
            <span className={step === 3 ? 'text-primary font-bold' : ''}>3. Selesai</span>
          </div>
        </div>

        {/* STEP 1: PROFIL & GOALS */}
        {step === 1 && (
          <Card className="rounded-3xl border border-border/80 shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  Kenalan Dulu, Siapa Nama Panggilan Anda?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Nama ini akan digunakan untuk personalisasi ringkasan finansial dan portofolio Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">
                  Nama Lengkap / Panggilan
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1.5 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">
                  Mata Uang Utama
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                      Rp
                    </span>
                    <span>Rupiah Indonesia (IDR)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    Standar Akuntansi
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Apa Fokus Utama Keuangan Anda? (Bisa pilih lebih dari satu)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'expense_tracking', label: 'Catat Pengeluaran Harian', icon: Target },
                    { id: 'budgeting', label: 'Kontrol Anggaran Bulanan', icon: PieChart },
                    { id: 'investing', label: 'Investasi Saham IDX & Crypto', icon: TrendingUp },
                    { id: 'debt_management', label: 'Kelola Cicilan & Hutang', icon: DollarSign },
                  ].map((g) => {
                    const Icon = g.icon;
                    const isSelected = selectedGoals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.id)}
                        className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full gap-2 rounded-xl py-3 font-bold shadow-sm"
              >
                <span>Lanjut: Atur Dompet Pertama</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: SETUP DOMPET PERTAMA (CORE REQUEST) */}
        {step === 2 && (
          <Card className="rounded-3xl border border-border/80 shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  Isi Dompet atau Rekening Utama Anda
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pilih rekening bank, e-wallet, atau uang tunai yang sering Anda gunakan dan tentukan saldo awal.
                </p>
              </div>

              {/* LIVE REALISTIC VIRTUAL CARD PREVIEW */}
              <div
                style={{ backgroundColor: walletColor }}
                className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
              >
                {/* Decorative background glow */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-black/15 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                    {institutionName || 'Rekening Utama'}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {walletType}
                    </span>
                  </div>
                </div>

                {/* EMV Chip & Contactless Visual */}
                <div className="my-4 flex items-center gap-3">
                  <div className="h-6 w-9 rounded bg-amber-300/80 border border-amber-400 shadow-inner flex items-center justify-center">
                    <div className="h-3 w-5 border border-amber-500/60 rounded-[2px]" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest opacity-70">
                    {accountNumber ? `•••• ${accountNumber.slice(-4)}` : '•••• 8899'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-medium opacity-75">Saldo Awal</span>
                  <div className="text-xl font-extrabold tracking-tight sm:text-2xl drop-shadow-sm">
                    {formatIDR(openingBalance)}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-[10px]">
                  <span className="font-semibold uppercase tracking-wider truncate max-w-[200px]">
                    {walletName || 'Dompet ArtosKu'}
                  </span>
                  <span className="font-mono opacity-80">{displayName}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Pilih Cepat Institusi Rekening:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WALLET_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        walletName === preset.name
                          ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'border-border/80 bg-muted/40 text-foreground hover:bg-muted'
                      }`}
                    >
                      {preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Tipe Rekening */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Jenis Dompet / Akun
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'bank' as AccountType, label: 'Bank', icon: Building2 },
                      { type: 'ewallet' as AccountType, label: 'E-Wallet', icon: Smartphone },
                      { type: 'cash' as AccountType, label: 'Tunai', icon: Banknote },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isActive = walletType === t.type;
                      return (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => setWalletType(t.type)}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                            isActive
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nama Dompet */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Nama Dompet / Rekening
                  </label>
                  <Input
                    type="text"
                    required
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="Contoh: BCA Tabungan Utama"
                    className="mt-1 text-xs"
                  />
                </div>

                {/* Input Saldo Awal */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Saldo Awal Saat Ini (Rupiah)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={balanceInput ? Number(balanceInput).toLocaleString('id-ID') : ''}
                      onChange={handleBalanceChange}
                      placeholder="0"
                      className="pl-9 text-sm font-bold text-foreground"
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => {
                          setOpeningBalance(q.value);
                          setBalanceInput(String(q.value));
                        }}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                          openingBalance === q.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nomor Rekening (Opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Nomor Rekening / Akun (Opsional)
                  </label>
                  <Input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="mt-1 text-xs"
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Warna Tema Kartu
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setWalletColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`h-7 w-7 rounded-full transition-transform ${
                          walletColor === c.hex
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                            : 'hover:scale-105 opacity-85'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Kembali</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 gap-2 rounded-xl font-bold shadow-sm"
                >
                  <span>Tinjau & Konfirmasi</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: REVIEW & LAUNCH */}
        {step === 3 && (
          <Card className="rounded-3xl border border-border/80 shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-foreground sm:text-xl">
                  Dompet Anda Siap Digunakan!
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Semua pengaturan awal telah lengkap. Dompet pertama Anda akan langsung aktif di dasbor.
                </p>
              </div>

              {/* Card Summary Badge */}
              <div
                style={{ backgroundColor: walletColor }}
                className="mx-auto max-w-sm rounded-2xl p-4 text-white shadow-lg text-left"
              >
                <div className="flex justify-between items-center text-[11px] opacity-85">
                  <span className="font-bold uppercase">{institutionName || walletName}</span>
                  <span className="uppercase font-semibold">{walletType}</span>
                </div>
                <div className="my-2">
                  <span className="text-[10px] opacity-75">Saldo Tersedia</span>
                  <div className="text-xl font-black">{formatIDR(openingBalance)}</div>
                </div>
                <div className="text-[10px] opacity-80 font-mono">
                  Pemilik: {displayName}
                </div>
              </div>

              {/* Checklist */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Mata uang IDR & profil pengguna terkonfigurasi</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Saldo awal <b>{formatIDR(openingBalance)}</b> tercatat di riwayat</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Kategori pengeluaran & pemasukan standar siap pakai</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Ubah</span>
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="flex-1 gap-2 rounded-xl py-3 text-sm font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <span>
                    {isSubmitting ? 'Menyiapkan Dasbor...' : 'Mulai Kelola Keuangan 🚀'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
