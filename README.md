# ArtosKu — Personal Finance & Wealth Management Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS v3](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?style=flat)](https://web.dev/progressive-web-apps/)

**ArtosKu** adalah aplikasi manajemen finansial pribadi modern, mobile-first, dan berstandar akuntansi presisi yang mengintegrasikan:
- 💳 **Keuangan Harian & Multi-Rekening**: Bank BCA, Mandiri, e-wallet (GoPay, OVO), kas tunai, dan rekening dana investor (RDI).
- 📈 **Portofolio Saham IDX**: Penghitungan lot & lembar saham (1 lot = 100 lembar), weighted average cost (WAC), serta floating & realized profit/loss.
- 🪙 **Portofolio Cryptocurrency**: Kuantitas fraksional (BTC, ETH, SOL, dsb.) dengan integrasi harga pasar realtime.
- 🤝 **Manajemen Piutang (Receivables)**: Pencatatan uang yang dipinjamkan, pelunasan bertahap/cicilan, dan integrasi saldo otomatis tanpa mendistorsi pendapatan biasa.
- 🏷️ **Cicilan & Hutang (Debts & Liabilities)**: Pemisahan pokok vs bunga (flat/efektif), tracking sisa tenor, dan jadwal jatuh tempo bulanan.
- 📊 **Kekayaan Bersih (Net Worth)**: Dihitung secara objektif dengan rumus:
  $$\text{Net Worth} = \text{Kas \& Bank} + \text{Nilai Pasar Investasi} + \text{Piutang Aktif} - \text{Total Kewajiban Hutang}$$
- 📱 **Progressive Web App (PWA) & Offline-First**: Dapat diinstal di Android, iOS, dan Desktop, dengan sinkronisasi antrean IndexedDB.

---

## 🚀 Fitur Unggulan

1. **Dashboard Finansial Komprehensif**
   - Ringkasan Net Worth tanpa *double counting*.
   - Grafik arus kas bulanan (Pemasukan vs Pengeluaran vs Tabungan).
   - Grafik pie distribusi kategori pengeluaran.
   - Rekap saldo rekening likuid.
   - Peringatan jatuh tempo cicilan dan piutang.

2. **Manajemen Transaksi Presisi**
   - Mendukung tipe transaksi: Pemasukan, Pengeluaran, Transfer Antar Rekening, Investasi, Pelunasan Piutang, Pembayaran Cicilan, dan Penyesuaian Saldo.
   - Filter tanggal, kategori, rekening, tipe transaksi, dan pencarian cepat.
   - Ekspor data transaksi ke format CSV secara instan.
   - Fitur duplikasi transaksi satu klik.

3. **Portofolio Saham Bursa Efek Indonesia (IDX)**
   - Mendukung emiten IHSG (BBCA, BBRI, BMRI, TLKM, ASII, dll.).
   - Otomatis mengkonversi Lot ke Lembar Saham ($1\text{ Lot} = 100\text{ Lembar}$).
   - Memasukkan biaya transaksi/broker ke dalam basis biaya (*cost basis*).
   - Update harga pasar otomatis & manual fallback.

4. **Portofolio Cryptocurrency**
   - Satuan desimal fraksional presisi tinggi.
   - Integrasi API CoinGecko untuk pembaruan harga realtime IDR.

5. **Pengelolaan Piutang & Cicilan**
   - Pelunasan pokok piutang menambah saldo rekening dan mengurangi piutang (tidak dihitung sebagai pemasukan konsumtif).
   - Pembayaran cicilan memisahkan porsi pokok hutang dan bunga pinjaman.

6. **PWA & Offline Synchronization Engine**
   - Penyimpanan lokal berjenjang dengan IndexedDB (`idb`).
   - Pendeteksi status koneksi (Online/Offline) dan indikator antrean mutasi.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 App Router](https://nextjs.org/) + TypeScript
- **Styling**: [Tailwind CSS v3 (Stable)](https://tailwindcss.com/)
- **State & Storage**: React Context + IndexedDB (`idb`) + Supabase SDK
- **Database**: PostgreSQL di [Supabase](https://supabase.com/) dengan Row Level Security (RLS)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Engine**: [date-fns](https://date-fns.org/) dengan locale bahasa Indonesia
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📦 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- Node.js versi 18.17+ atau 20+ (direkomendasikan Node.js 22 LTS).
- npm atau pnpm.

### 2. Clone & Pasang Dependensi
```bash
git clone https://github.com/username/artosku-2.git
cd artosku-2
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi kredensial Supabase Anda (opsional untuk mode online, aplikasi tetap berfungsi penuh di mode offline/local caching jika dikosongkan):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Menjalankan Pengujian Otomatis (Unit Tests)
```bash
npm run test
```

---

## 🗄️ Setup Database Supabase

1. Buat project baru di [Supabase Dashboard](https://app.supabase.com).
2. Buka menu **SQL Editor**.
3. Jalankan script migrasi yang ada di file:
   `supabase/migrations/0001_initial_schema.sql`
4. (Opsional) Jalankan script seed data contoh di:
   `supabase/seed.sql`
5. Salin `Project URL` dan `anon public API key` dari **Project Settings > API** ke file `.env.local`.

---

## 🌐 Menghubungkan Market Data Provider Eksternal

Aplikasi telah mengadopsi abstraksi provider pasar di `src/lib/finance/marketData.ts`:
- **Crypto**: Terhubung dengan CoinGecko Public Simple Price API (`BTC`, `ETH`, `SOL`, dll. dikonversi ke IDR).
- **Saham IDX**: Menggunakan benchmark IDX dengan kemampuan peremajaan harga manual satu-klik atau menghubungkan endpoint API sekuritas pilihan Anda melalui implementasi interface `MarketDataProvider`.

---

## 📱 PWA (Progressive Web App)

Aplikasi memiliki `manifest.webmanifest` dan Service Worker `sw.js`:
- Di browser Chrome/Edge: Klik ikon **Install App** di address bar.
- Di Safari iOS: Klik tombol **Share** > **Add to Home Screen**.

---

## 📄 Lisensi
MIT License © 2026 ArtosKu Development Team.
