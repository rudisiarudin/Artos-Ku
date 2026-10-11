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
  Wifi,
  Coins,
  Check,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../lib/db/types';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { formatIDR } from '../../lib/finance/formatters';
import { cn } from '../../lib/utils';
import { BcaLogo } from '../../components/shared/BankLogos';

interface WalletPreset {
  id: string;
  name: string;
  shortName: string;
  institution: string;
  type: AccountType;
  gradient: string;
  colorHex: string;
  badge: string;
}

const WALLET_PRESETS: WalletPreset[] = [
  {
    id: 'bca',
    name: 'BCA Tahapan Utama',
    shortName: 'BCA',
    institution: 'Bank Central Asia',
    type: 'bank',
    gradient: 'from-[#003B73] via-[#005E9E] to-[#002244]',
    colorHex: '#005E9E',
    badge: 'BCA',
  },
  {
    id: 'mandiri',
    name: 'Mandiri Tabungan Now',
    shortName: 'Mandiri',
    institution: 'Bank Mandiri',
    type: 'bank',
    gradient: 'from-[#001D4A] via-[#002D62] to-[#0A1128]',
    colorHex: '#002D62',
    badge: 'MANDIRI',
  },
  {
    id: 'bri',
    name: 'BRI BritAma',
    shortName: 'BRI',
    institution: 'Bank Rakyat Indonesia',
    type: 'bank',
    gradient: 'from-[#003366] via-[#00529B] to-[#001f3f]',
    colorHex: '#00529B',
    badge: 'BRI',
  },
  {
    id: 'gopay',
    name: 'GoPay Saldo Harian',
    shortName: 'GoPay',
    institution: 'GoTo Financial',
    type: 'ewallet',
    gradient: 'from-[#005C0B] via-[#008A11] to-[#003D06]',
    colorHex: '#00AA13',
    badge: 'GOPAY',
  },
  {
    id: 'dana',
    name: 'DANA Dompet Digital',
    shortName: 'DANA',
    institution: 'DANA Indonesia',
    type: 'ewallet',
    gradient: 'from-[#0A568C] via-[#118EEA] to-[#073659]',
    colorHex: '#118EEA',
    badge: 'DANA',
  },
  {
    id: 'ovo',
    name: 'OVO Cash',
    shortName: 'OVO',
    institution: 'OVO Digital',
    type: 'ewallet',
    gradient: 'from-[#371E70] via-[#4C3494] to-[#1E0F40]',
    colorHex: '#4C3494',
    badge: 'OVO',
  },
  {
    id: 'cash',
    name: 'Dompet Fisik Tunai',
    shortName: 'Tunai',
    institution: 'Cash on Hand',
    type: 'cash',
    gradient: 'from-[#064E3B] via-[#047857] to-[#022C22]',
    colorHex: '#10B981',
    badge: 'CASH',
  },
  {
    id: 'titanium',
    name: 'Black Titanium Card',
    shortName: 'Black Metal',
    institution: 'Privilege Wealth',
    type: 'bank',
    gradient: 'from-zinc-950 via-zinc-900 to-black',
    colorHex: '#18181B',
    badge: 'EXCLUSIVE',
  },
];

const QUICK_AMOUNTS = [
  { label: 'Rp 0', value: 0 },
  { label: 'Rp 500rb', value: 500000 },
  { label: 'Rp 1 Juta', value: 1000000 },
  { label: 'Rp 5 Juta', value: 5000000 },
  { label: 'Rp 10 Juta', value: 10000000 },
  { label: 'Rp 25 Juta', value: 25000000 },
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
    'investing',
  ]);

  // Step 2: First Wallet Setup
  const [selectedPreset, setSelectedPreset] = useState<WalletPreset>(WALLET_PRESETS[0]);
  const [walletName, setWalletName] = useState('BCA Tahapan Utama');
  const [walletType, setWalletType] = useState<AccountType>('bank');
  const [institutionName, setInstitutionName] = useState('Bank Central Asia');
  const [accountNumber, setAccountNumber] = useState('52748899');
  const [openingBalance, setOpeningBalance] = useState<number>(5000000);
  const [balanceInput, setBalanceInput] = useState<string>('5000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleApplyPreset = (preset: WalletPreset) => {
    setSelectedPreset(preset);
    setWalletName(preset.name);
    setInstitutionName(preset.institution);
    setWalletType(preset.type);
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
        color: selectedPreset.colorHex,
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

  // Realistic Luxury Virtual Card Component
  const renderVirtualCard = () => (
    <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px] transition-all duration-300">
      {/* Ambient colorful glow beneath card */}
      <div
        className={cn(
          'absolute -inset-1 rounded-3xl opacity-40 blur-xl transition-all duration-500',
          selectedPreset.gradient
        )}
      />

      <div
        className={cn(
          'relative flex h-[215px] sm:h-[225px] flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/25 p-5 sm:p-6 text-white shadow-2xl transition-all duration-500 overflow-hidden select-none bg-gradient-to-br',
          selectedPreset.gradient
        )}
      >
        {/* Glossy specular reflection sheen */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-52 w-52 rounded-full bg-black/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Card Top: Bank Brand & NFC */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedPreset.id === 'bca' ? (
              <BcaLogo className="h-6" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur-md border border-white/20">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-white/95 drop-shadow-xs">
                {selectedPreset.badge}
              </span>
              <span className="block text-[9px] font-medium tracking-wide text-white/70 truncate max-w-[170px]">
                {institutionName || 'ArtosKu Digital'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Wifi className="h-4 w-4 rotate-90 text-white/80" />
            <Badge
              variant="outline"
              className="border-white/30 bg-white/10 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 backdrop-blur-sm"
            >
              {walletType}
            </Badge>
          </div>
        </div>

        {/* Card Middle: EMV Chip & Live Balance */}
        <div className="my-auto py-1">
          <div className="flex items-center justify-between mb-2">
            {/* Metallic Golden EMV Chip */}
            <div className="relative h-6 w-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-md border border-amber-100/60 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 border border-amber-700/30 rounded-[2px] m-[2px]" />
              <div className="h-full w-[1px] bg-amber-700/30" />
              <div className="w-full h-[1px] bg-amber-700/30 absolute" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">
              Saldo Awal
            </span>
          </div>

          {/* Formatted Large Balance */}
          <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            {formatIDR(openingBalance)}
          </div>
        </div>

        {/* Card Bottom: Number, Holder Name, & Card Logo */}
        <div className="flex items-end justify-between border-t border-white/15 pt-2">
          <div>
            <div className="font-mono text-[11px] tracking-widest text-white/80 drop-shadow-xs">
              •••• •••• •••• {accountNumber ? accountNumber.slice(-4) : '8899'}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/90 font-bold truncate max-w-[180px]">
              {displayName || 'PEMILIK AKUN'}
            </div>
          </div>

          {/* Overlapping Circles Hologram Badge */}
          <div className="flex items-center">
            <div className="h-5 w-5 rounded-full bg-rose-500/90 shadow-sm" />
            <div className="-ml-2.5 h-5 w-5 rounded-full bg-amber-400/90 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-8 selection:bg-primary/20">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" showText={true} />

          {/* iOS Style Floating Pill Stepper */}
          <div className="mt-5 flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 p-1 backdrop-blur-md">
            {[
              { id: 1, label: '1. Profil' },
              { id: 2, label: '2. Dompet Pertama' },
              { id: 3, label: '3. Siap Pakai' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id as 1 | 2 | 3);
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                  step === s.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : step > s.id
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                    : 'text-muted-foreground opacity-60'
                )}
              >
                {step > s.id && <Check className="h-3 w-3" />}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: USER PROFILE & GOALS */}
        {step === 1 && (
          <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Langkah 1 dari 3
              </span>
              <h1 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
                Halo! Mari Atur Akun Finansial Anda
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Sesuaikan nama dan tujuan utama pengelolaan keuangan pribadi Anda.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Lengkap / Panggilan
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="rounded-xl py-3 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Mata Uang & Standar Akuntansi
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 font-black text-emerald-600 dark:text-emerald-400">
                      Rp
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Rupiah Indonesia (IDR)</p>
                      <p className="text-[11px] text-muted-foreground">Format standar akuntansi presisi</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                    Aktif
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Apa Fokus Utama Anda di ArtosKu?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'expense_tracking', label: 'Catat Pengeluaran Harian', icon: Target, desc: 'Pemasukan & belanja' },
                    { id: 'budgeting', label: 'Kontrol Anggaran Bulanan', icon: PieChart, desc: 'Batas & evaluasi' },
                    { id: 'investing', label: 'Saham IDX & Crypto', icon: TrendingUp, desc: 'Pantau portofolio' },
                    { id: 'debt_management', label: 'Cicilan & Piutang', icon: DollarSign, desc: 'Jadwal jatuh tempo' },
                  ].map((g) => {
                    const Icon = g.icon;
                    const isSelected = selectedGoals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.id)}
                        className={cn(
                          'flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold'
                            : 'border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <Icon className="h-4 w-4" />
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <span className="text-xs font-bold leading-tight text-foreground">{g.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{g.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setStep(2)}
              className="w-full gap-2 rounded-xl py-3 font-bold shadow-md text-sm"
            >
              <span>Lanjut: Buka Dompet Pertama</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: FIRST WALLET SETUP (INTERACTIVE CARD EXPERIENCE) */}
        {step === 2 && (
          <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Langkah 2 dari 3
              </span>
              <h1 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
                Buat & Isi Dompet Pertama Anda
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih rekening bank, e-wallet, atau uang tunai dan masukkan saldo awal Anda.
              </p>
            </div>

            {/* REALISTIC LUXURY VIRTUAL CARD PREVIEW */}
            {renderVirtualCard()}

            {/* Quick Preset Chips */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Pilih Cepat Institusi Rekening:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_PRESETS.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                          : 'border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {preset.id === 'bca' ? (
                        <BcaLogo className="h-4 my-0.5" />
                      ) : (
                        <span className="text-xs font-bold leading-tight">{preset.shortName}</span>
                      )}
                      <span className="text-[9px] uppercase tracking-wider opacity-75">{preset.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Details */}
            <div className="space-y-4">
              {/* Nama Dompet */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Dompet / Rekening
                </label>
                <Input
                  type="text"
                  required
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="Contoh: BCA Tahapan Utama"
                  className="rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Saldo Awal (Rupiah) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Saldo Awal Saat Ini
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Diperbarui langsung di kartu
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={balanceInput ? Number(balanceInput).toLocaleString('id-ID') : ''}
                    onChange={handleBalanceChange}
                    placeholder="0"
                    className="rounded-xl pl-10 text-base font-extrabold text-foreground"
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
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition',
                        openingBalance === q.value
                          ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nomor Rekening */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nomor Rekening / Kartu (Opsional)
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 52748899"
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
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
                className="flex-1 gap-2 rounded-xl py-3 text-sm font-bold shadow-md"
              >
                <span>Tinjau & Konfirmasi</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CELEBRATION & READY TO LAUNCH (FIXED BEAUTIFUL DESIGN) */}
        {step === 3 && (
          <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 space-y-6 text-center">
            {/* Header Badge */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-3 py-1 mb-1"
              >
                🎉 Dompet Siap Digunakan
              </Badge>
              <h1 className="text-xl font-black text-foreground sm:text-2xl">
                Akun & Dompet Anda Siap Meluncur!
              </h1>
              <p className="mt-1 text-xs text-muted-foreground max-w-md">
                Semua pengaturan awal telah lengkap. Kartu virtual pertama Anda telah aktif dan siap mencatat arus kas.
              </p>
            </div>

            {/* SHOWCASE THE LUXURY VIRTUAL CARD */}
            <div className="py-2">
              {renderVirtualCard()}
            </div>

            {/* Feature Checklist Summary */}
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-foreground font-semibold">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Dompet utama <b>{walletName}</b> terdaftar dengan saldo awal <b>{formatIDR(openingBalance)}</b></span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-semibold">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Kategori pendapatan & pengeluaran standar telah disiapkan</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-semibold">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Arsitektur offline-first & sinkronisasi otomatis aktif</span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep(2)}
                className="rounded-xl px-4 text-xs font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Ubah Dompet</span>
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>
                  {isSubmitting ? 'Menyiapkan Dasbor...' : 'Mulai Kelola Keuangan Sekarang 🚀'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
