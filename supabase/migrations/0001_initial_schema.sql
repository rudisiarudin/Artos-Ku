-- ============================================================================
-- ARTOSKU: PERSONAL FINANCE MANAGEMENT SCHEMA
-- PostgreSQL & Supabase Database Migration (Robust & Idempotent)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    locale TEXT DEFAULT 'id-ID' NOT NULL,
    timezone TEXT DEFAULT 'Asia/Jakarta' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. ACCOUNTS & WALLETS
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'brokerage', 'crypto_wallet', 'other')),
    account_number TEXT,
    institution_name TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    opening_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    current_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    color TEXT DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#64748B',
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "date" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'income',
        'expense',
        'transfer',
        'investment_buy',
        'investment_sell',
        'receivable_disbursement',
        'receivable_repayment',
        'debt_disbursement',
        'debt_repayment',
        'installment_payment',
        'balance_adjustment'
    )),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    notes TEXT,
    payment_method TEXT DEFAULT 'transfer',
    tags TEXT[],
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure "date" and other critical columns exist if transactions table pre-existed
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS "date" TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;
DO $$
BEGIN
    ALTER TABLE public.transactions ALTER COLUMN reference_id TYPE TEXT USING reference_id::text;
EXCEPTION WHEN OTHERS THEN
    NULL;
END
$$;

-- 5. BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, category_id, month_year)
);

-- 6. RECURRING TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL,
    source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. INVESTMENT ASSETS & PORTFOLIO (Stocks, Crypto, Mutual Funds, Gold)
CREATE TABLE IF NOT EXISTS public.investment_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'mutual_fund', 'gold', 'other')),
    ticker TEXT NOT NULL, -- e.g. BBCA, BBRI, BTC, ETH
    name TEXT NOT NULL,
    platform TEXT, -- e.g. Stockbit, Ajaib, Bibit, Pluang, Indodax
    lots NUMERIC(15, 4), -- For IDX stocks: 1 lot = 100 shares
    shares_or_units NUMERIC(18, 8) DEFAULT 0.00,
    average_buy_price NUMERIC(18, 6) DEFAULT 0.00,
    exchange TEXT, -- IDX, Binance, Indodax, etc.
    currency TEXT DEFAULT 'IDR' NOT NULL,
    current_price NUMERIC(18, 6) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    last_price_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, ticker, asset_type)
);

-- Backward-compatibility / alias table for assets
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'mutual_fund', 'gold', 'other')),
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT,
    lots NUMERIC(15, 4),
    shares_or_units NUMERIC(18, 8) DEFAULT 0.00,
    average_buy_price NUMERIC(18, 6) DEFAULT 0.00,
    exchange TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    current_price NUMERIC(18, 6) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    last_price_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, ticker, asset_type)
);

-- 8. INVESTMENT TRADES
CREATE TABLE IF NOT EXISTS public.investment_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    trade_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    lots NUMERIC(15, 4), -- For IDX stocks: 1 lot = 100 shares
    shares_or_units NUMERIC(18, 8) NOT NULL CHECK (shares_or_units > 0),
    price_per_unit NUMERIC(18, 6) NOT NULL CHECK (price_per_unit > 0),
    fee NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    realized_pl NUMERIC(15, 2) DEFAULT 0.00,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. DIVIDENDS
CREATE TABLE IF NOT EXISTS public.dividends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    tax_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    net_amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. RECEIVABLES (Piutang)
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    borrower_name TEXT NOT NULL,
    borrower_phone TEXT,
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    current_balance NUMERIC(15, 2) NOT NULL CHECK (current_balance >= 0),
    interest_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue')),
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. RECEIVABLE PAYMENTS
CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    principal_paid NUMERIC(15, 2) NOT NULL CHECK (principal_paid > 0),
    interest_paid NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_received NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. DEBTS & INSTALLMENTS (Hutang & Cicilan)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creditor_name TEXT NOT NULL,
    debt_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('installment', 'credit_card', 'mortgage', 'personal_loan', 'bnpl', 'other')),
    original_principal NUMERIC(15, 2) NOT NULL CHECK (original_principal > 0),
    current_principal NUMERIC(15, 2) NOT NULL CHECK (current_principal >= 0),
    interest_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    interest_type TEXT DEFAULT 'flat' CHECK (interest_type IN ('flat', 'effective', 'none')),
    tenor_months INTEGER DEFAULT 12 NOT NULL CHECK (tenor_months > 0),
    monthly_installment NUMERIC(15, 2) NOT NULL CHECK (monthly_installment >= 0),
    due_day INTEGER DEFAULT 1 NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    remaining_installments INTEGER NOT NULL CHECK (remaining_installments >= 0),
    disbursement_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'overdue')),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. DEBT PAYMENTS
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    installment_number INTEGER NOT NULL,
    principal_paid NUMERIC(15, 2) NOT NULL CHECK (principal_paid >= 0),
    interest_paid NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (interest_paid >= 0),
    fee_paid NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. REMINDERS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL CHECK (type IN ('installment', 'receivable', 'budget', 'custom')),
    due_date TIMESTAMPTZ NOT NULL,
    related_id UUID,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic idempotent policies for each user to only access their own records
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'accounts', 'categories', 'transactions', 'budgets',
            'recurring_transactions', 'investment_assets', 'investment_trades',
            'dividends', 'receivables', 'receivable_payments', 'debts',
            'debt_payments', 'reminders', 'audit_logs'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_user_policy ON public.%I;', tbl, tbl);
        EXECUTE format('
            CREATE POLICY %I_user_policy ON public.%I
            FOR ALL USING (auth.uid() = %s)
            WITH CHECK (auth.uid() = %s);
        ', tbl, tbl, CASE WHEN tbl = 'profiles' THEN 'id' ELSE 'user_id' END, CASE WHEN tbl = 'profiles' THEN 'id' ELSE 'user_id' END);
    END LOOP;
END
$$;

-- Indexes for high-speed queries and reporting (Safe and Quoted)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, "date" DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_trades_asset ON public.investment_trades(asset_id, trade_date ASC);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(user_id, status);

-- ============================================================================
-- AUTOMATIC USER INITIALIZATION TRIGGER
-- Automatically creates a profile and starter categories when a user signs up
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    BEGIN
        -- 1. Create Profile
        INSERT INTO public.profiles (id, email, full_name, currency, locale, timezone)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
            'IDR',
            'id-ID',
            'Asia/Jakarta'
        )
        ON CONFLICT (id) DO NOTHING;

        -- 2. Insert Starter Categories with deterministic UUIDs
        INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system)
        VALUES
            ('c0000000-0000-4000-8000-000000000001', new.id, 'Gaji & Bonus', 'income', 'Wallet', '#10B981', true),
            ('c0000000-0000-4000-8000-000000000002', new.id, 'Bisnis & Freelance', 'income', 'Briefcase', '#06B6D4', true),
            ('c0000000-0000-4000-8000-000000000003', new.id, 'Makanan & Minuman', 'expense', 'Utensils', '#F59E0B', true),
            ('c0000000-0000-4000-8000-000000000004', new.id, 'Transport & Bensin', 'expense', 'Car', '#3B82F6', true),
            ('c0000000-0000-4000-8000-000000000005', new.id, 'Tagihan & Utilitas', 'expense', 'Zap', '#EF4444', true),
            ('c0000000-0000-4000-8000-000000000006', new.id, 'Belanja & Belanjaan', 'expense', 'ShoppingBag', '#EC4899', true),
            ('c0000000-0000-4000-8000-000000000007', new.id, 'Hiburan & Liburan', 'expense', 'Film', '#A855F7', true),
            ('c0000000-0000-4000-8000-000000000008', new.id, 'Cicilan & Hutang', 'expense', 'CreditCard', '#DC2626', true)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
