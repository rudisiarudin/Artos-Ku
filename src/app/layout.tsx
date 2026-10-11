import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeProvider';
import { FinanceProvider } from '../context/FinanceContext';
import { DesktopSidebar } from '../components/layout/DesktopSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { TransactionFormModal } from '../components/forms/TransactionFormModal';
import { StockTradeModal } from '../components/forms/StockTradeModal';
import { CryptoTradeModal } from '../components/forms/CryptoTradeModal';
import { ReceivableFormModal } from '../components/forms/ReceivableFormModal';
import { DebtFormModal } from '../components/forms/DebtFormModal';
import { AccountFormModal } from '../components/forms/AccountFormModal';
import { ServiceWorkerRegister } from '../components/shared/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ArtosKu — Personal Finance & Wealth Management',
  description:
    'Aplikasi manajemen keuangan pribadi, portofolio saham IDX, crypto, piutang, dan cicilan terintegrasi dengan standar akuntansi presisi.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ArtosKu',
  },
};

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FinanceProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              {/* Desktop Navigation Sidebar */}
              <DesktopSidebar />

              {/* Main Content Area */}
              <div className="flex flex-1 flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-6">
                <AppHeader />
                <main className="flex-1 px-4 py-3 sm:px-6 sm:py-6">{children}</main>
              </div>

              {/* Mobile Bottom Navigation Bar */}
              <BottomNav />

              {/* Global Financial Modals */}
              <TransactionFormModal />
              <StockTradeModal />
              <CryptoTradeModal />
              <ReceivableFormModal />
              <DebtFormModal />
              <AccountFormModal />
              <ServiceWorkerRegister />
            </div>
          </FinanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
