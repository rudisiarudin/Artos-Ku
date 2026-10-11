-- ============================================================================
-- ARTOSKU: SEED DATA FOR DEVELOPMENT AND TESTING
-- ============================================================================

-- Replace with actual user ID when executing in Supabase dashboard
-- Example placeholder ID: '00000000-0000-0000-0000-000000000001'

DO $$
DECLARE
    uid UUID := '00000000-0000-0000-0000-000000000001';
    acc_bca UUID := uuid_generate_v4();
    acc_mandiri UUID := uuid_generate_v4();
    acc_gopay UUID := uuid_generate_v4();
    acc_cash UUID := uuid_generate_v4();
    acc_rdi UUID := uuid_generate_v4();
    
    cat_salary UUID := uuid_generate_v4();
    cat_food UUID := uuid_generate_v4();
    cat_transport UUID := uuid_generate_v4();
    cat_bills UUID := uuid_generate_v4();
    cat_shopping UUID := uuid_generate_v4();
    cat_invest UUID := uuid_generate_v4();

    asset_bbca UUID := uuid_generate_v4();
    asset_bbri UUID := uuid_generate_v4();
    asset_btc UUID := uuid_generate_v4();

    rec_1 UUID := uuid_generate_v4();
    debt_motor UUID := uuid_generate_v4();
BEGIN
    -- 1. Profile
    INSERT INTO public.profiles (id, email, full_name, currency, locale, timezone)
    VALUES (uid, 'demo@artosku.id', 'Budi Santoso', 'IDR', 'id-ID', 'Asia/Jakarta')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Accounts
    INSERT INTO public.accounts (id, user_id, name, type, account_number, institution_name, opening_balance, current_balance, color)
    VALUES
        (acc_bca, uid, 'BCA Tahapan', 'bank', '8271928371', 'Bank Central Asia', 10000000, 18450000, '#005E9E'),
        (acc_mandiri, uid, 'Mandiri Payroll', 'bank', '123000998877', 'Bank Mandiri', 5000000, 7200000, '#002D62'),
        (acc_gopay, uid, 'GoPay Wallet', 'ewallet', '081234567890', 'GoTo Financial', 500000, 850000, '#00AA13'),
        (acc_cash, uid, 'Dompet Tunai', 'cash', NULL, 'Cash on Hand', 1500000, 1200000, '#10B981'),
        (acc_rdi, uid, 'RDI BCA Sekuritas', 'brokerage', '9988112233', 'BCA Sekuritas', 5000000, 3500000, '#8B5CF6')
    ON CONFLICT DO NOTHING;

    -- 3. Categories
    INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system)
    VALUES
        (cat_salary, uid, 'Gaji & Pendapatan', 'income', 'wallet', '#10B981', true),
        (cat_food, uid, 'Makanan & Minuman', 'expense', 'coffee', '#F59E0B', true),
        (cat_transport, uid, 'Transport & Bensin', 'expense', 'car', '#3B82F6', true),
        (cat_bills, uid, 'Tagihan & Utilitas', 'expense', 'zap', '#EF4444', true),
        (cat_shopping, uid, 'Belanja Kebutuhan', 'expense', 'shopping-bag', '#EC4899', true),
        (cat_invest, uid, 'Investasi & Tabungan', 'expense', 'trending-up', '#8B5CF6', true)
    ON CONFLICT DO NOTHING;

    -- 4. Investment Assets
    INSERT INTO public.investment_assets (id, user_id, asset_type, ticker, name, exchange, current_price, last_price_updated_at)
    VALUES
        (asset_bbca, uid, 'stock', 'BBCA', 'Bank Central Asia Tbk', 'IDX', 10250.00, NOW()),
        (asset_bbri, uid, 'stock', 'BBRI', 'Bank Rakyat Indonesia Tbk', 'IDX', 4850.00, NOW()),
        (asset_btc, uid, 'crypto', 'BTC', 'Bitcoin', 'Global', 1420000000.00, NOW())
    ON CONFLICT DO NOTHING;

    -- 5. Stock Trades (BBCA: 10 lots = 1,000 shares @ Rp9,800)
    INSERT INTO public.investment_trades (id, user_id, asset_id, trade_type, trade_date, lots, shares_or_units, price_per_unit, fee, total_amount, account_id)
    VALUES
        (uuid_generate_v4(), uid, asset_bbca, 'buy', NOW() - INTERVAL '30 days', 10, 1000, 9800.00, 15000.00, 9815000.00, acc_rdi),
        (uuid_generate_v4(), uid, asset_bbri, 'buy', NOW() - INTERVAL '15 days', 20, 2000, 4600.00, 14000.00, 9214000.00, acc_rdi)
    ON CONFLICT DO NOTHING;

    -- 6. Receivables (Piutang)
    INSERT INTO public.receivables (id, user_id, borrower_name, borrower_phone, principal_amount, current_balance, loan_date, due_date, status, account_id, purpose)
    VALUES
        (rec_1, uid, 'Dimas Pratama', '081298765432', 2500000, 1500000, CURRENT_DATE - 20, CURRENT_DATE + 10, 'partially_paid', acc_bca, 'Pinjaman biaya servis motor')
    ON CONFLICT DO NOTHING;

    -- 7. Debts & Installments (Cicilan)
    INSERT INTO public.debts (id, user_id, creditor_name, debt_name, type, original_principal, current_principal, interest_rate, tenor_months, monthly_installment, due_day, remaining_installments, payment_account_id, start_date)
    VALUES
        (debt_motor, uid, 'FIF Group', 'Cicilan Honda Vario 160', 'installment', 26000000, 17500000, 8.5, 24, 1250000, 5, 14, acc_bca, CURRENT_DATE - 300)
    ON CONFLICT DO NOTHING;

END
$$;
