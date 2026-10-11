import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { CurrencyDisplay } from './CurrencyDisplay';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  type?: 'income' | 'expense' | 'neutral';
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  type = 'neutral',
  badgeText,
  badgeType = 'neutral',
  onClick,
  className,
}: StatCardProps) {
  const getBadgeVariant = () => {
    if (badgeType === 'positive') return 'success';
    if (badgeType === 'negative') return 'destructive';
    return 'secondary';
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border p-0 transition-all',
        onClick && 'cursor-pointer hover:border-foreground/20 hover:shadow-sm active:scale-[0.99]',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground line-clamp-1">{title}</span>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <CurrencyDisplay amount={amount} type={type} size="lg" />
          {badgeText && (
            <Badge variant={getBadgeVariant()} className="text-[10px] px-1.5 py-0 font-medium">
              {badgeText}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
