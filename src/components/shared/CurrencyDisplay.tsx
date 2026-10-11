import React from 'react';
import { formatIDR } from '../../lib/finance/formatters';
import { cn } from '../../lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSign?: boolean;
}

export function CurrencyDisplay({
  amount,
  type = 'neutral',
  size = 'md',
  className,
  showSign = false,
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-extrabold tracking-tight',
  };

  const colorClasses = {
    income: 'text-emerald-600 dark:text-emerald-400',
    expense: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-foreground',
  };

  let signPrefix = '';
  if (showSign) {
    if (type === 'income' || amount > 0) signPrefix = '+';
    if (type === 'expense' || amount < 0) signPrefix = '-';
  }

  const formatted = formatIDR(Math.abs(amount));

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-mono tabular-nums',
        sizeClasses[size],
        colorClasses[type],
        className
      )}
    >
      {signPrefix}
      {formatted}
    </span>
  );
}
