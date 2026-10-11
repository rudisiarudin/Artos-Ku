import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format numeric value into Indonesian Rupiah (IDR)
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatIDR(amount: number, options?: { hideSymbol?: boolean; showCents?: boolean }): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: options?.showCents ? 2 : 0,
    maximumFractionDigits: options?.showCents ? 2 : 0,
  }).format(absAmount);

  const prefix = isNegative ? '-Rp ' : 'Rp ';
  return options?.hideSymbol ? formatted : `${prefix}${formatted}`;
}

/**
 * Format currency with explicit +/- sign for transactions
 */
export function formatSignedIDR(amount: number, type: 'income' | 'expense' | 'neutral' = 'neutral'): string {
  const absFormatted = formatIDR(Math.abs(amount));
  if (type === 'income' || amount > 0) {
    return `+${absFormatted}`;
  }
  if (type === 'expense' || amount < 0) {
    return `-${absFormatted}`;
  }
  return absFormatted;
}

/**
 * Format date in Indonesian locale (Asia/Jakarta)
 */
export function formatIndonesianDate(dateInput: string | Date, pattern: 'short' | 'medium' | 'full' | 'time' = 'medium'): string {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';

    switch (pattern) {
      case 'short':
        return format(d, 'dd/MM/yyyy');
      case 'medium':
        return format(d, 'd MMM yyyy', { locale: id });
      case 'full':
        return format(d, 'EEEE, d MMMM yyyy', { locale: id });
      case 'time':
        return format(d, 'd MMM yyyy HH:mm', { locale: id });
      default:
        return format(d, 'd MMM yyyy', { locale: id });
    }
  } catch {
    return '-';
  }
}

/**
 * Format Indonesian stock shares and lots
 * Example: 1000 shares -> "10 Lot (1.000 Lembar)"
 */
export function formatStockQuantity(shares: number): string {
  const lots = Math.floor(shares / 100);
  const formattedShares = new Intl.NumberFormat('id-ID').format(shares);
  return `${lots} Lot (${formattedShares} lbr)`;
}

/**
 * Format percentage with positive/negative color sign
 */
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
