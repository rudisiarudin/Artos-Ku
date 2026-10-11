export type AccountType = 'cash' | 'bank' | 'ewallet' | 'brokerage' | 'crypto_wallet' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  account_number?: string | null;
  institution_name?: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  color: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'investment_buy'
  | 'investment_sell'
  | 'receivable_disbursement'
  | 'receivable_repayment'
  | 'debt_disbursement'
  | 'debt_repayment'
  | 'installment_payment'
  | 'balance_adjustment';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: TransactionType;
  amount: number;
  source_account_id?: string | null;
  destination_account_id?: string | null;
  category_id?: string | null;
  description: string;
  notes?: string | null;
  payment_method?: string;
  tags?: string[];
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month_year: string; // YYYY-MM
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  source_account_id?: string | null;
  destination_account_id?: string | null;
  category_id?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  is_active: boolean;
  created_at: string;
}

export type AssetType = 'stock' | 'crypto';

export interface InvestmentAsset {
  id: string;
  user_id: string;
  asset_type: AssetType;
  ticker: string;
  name: string;
  exchange?: string | null;
  currency: string;
  current_price: number;
  last_price_updated_at: string;
  created_at: string;
}

export type TradeType = 'buy' | 'sell';

export interface InvestmentTrade {
  id: string;
  user_id: string;
  asset_id: string;
  trade_type: TradeType;
  trade_date: string;
  lots?: number | null; // For Indonesian stocks: 1 lot = 100 shares
  shares_or_units: number;
  price_per_unit: number;
  fee: number;
  total_amount: number;
  realized_pl?: number | null;
  account_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Dividend {
  id: string;
  user_id: string;
  asset_id: string;
  account_id?: string | null;
  payment_date: string;
  amount: number;
  tax_amount: number;
  net_amount: number;
  notes?: string | null;
  created_at: string;
}

export type ReceivableStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

export interface Receivable {
  id: string;
  user_id: string;
  borrower_name: string;
  borrower_phone?: string | null;
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  loan_date: string;
  due_date: string;
  status: ReceivableStatus;
  account_id?: string | null;
  purpose?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceivablePayment {
  id: string;
  user_id: string;
  receivable_id: string;
  account_id: string;
  payment_date: string;
  principal_paid: number;
  interest_paid: number;
  total_received: number;
  notes?: string | null;
  created_at: string;
}

export type DebtType = 'installment' | 'credit_card' | 'mortgage' | 'personal_loan' | 'bnpl' | 'other';
export type DebtInterestType = 'flat' | 'effective' | 'none';
export type DebtStatus = 'active' | 'paid_off' | 'overdue';

export interface Debt {
  id: string;
  user_id: string;
  creditor_name: string;
  debt_name: string;
  type: DebtType;
  original_principal: number;
  current_principal: number;
  interest_rate: number;
  interest_type: DebtInterestType;
  tenor_months: number;
  monthly_installment: number;
  due_day: number;
  remaining_installments: number;
  disbursement_account_id?: string | null;
  payment_account_id?: string | null;
  status: DebtStatus;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  account_id: string;
  payment_date: string;
  installment_number: number;
  principal_paid: number;
  interest_paid: number;
  fee_paid: number;
  total_amount: number;
  notes?: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  message?: string | null;
  type: 'installment' | 'receivable' | 'budget' | 'custom';
  due_date: string;
  related_id?: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}
