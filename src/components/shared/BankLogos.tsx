import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'card' | 'color' | 'auto';
  alt?: string;
}

/**
 * Official Bank Central Asia (BCA) Logo
 * - variant 'card': seamless pure white vector logo printed directly on the card (no border, no box)
 * - variant 'color': official blue vector logo on transparent background
 */
export function BcaLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/bca-white.svg' : '/logos/bca.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Bank Central Asia"
      className={`object-contain transition-transform duration-200 ${className}`}
      loading="eager"
    />
  );
}

/**
 * Official Bank Mandiri Logo
 * - variant 'card': white text + golden ribbon on transparent background (no border, no box)
 * - variant 'color': official blue text + golden ribbon on transparent background
 */
export function MandiriLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/mandiri-white.svg' : '/logos/mandiri.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Bank Mandiri"
      className={`object-contain transition-transform duration-200 ${className}`}
      loading="eager"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/logos/mandiri.png';
      }}
    />
  );
}

/**
 * Official GoPay Logo
 * - variant 'card': cyan circle + white text on transparent background (no border, no box)
 * - variant 'color': cyan circle + black text on transparent background
 */
export function GopayLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/gopay-white.svg' : '/logos/gopay.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="GoPay"
      className={`object-contain transition-transform duration-200 ${className}`}
      loading="eager"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/logos/gopay.png';
      }}
    />
  );
}

/**
 * Smart Institution Logo Resolver
 */
export function InstitutionLogo({
  name,
  className = 'h-5 w-auto',
  variant = 'card',
}: {
  name: string;
  className?: string;
  variant?: 'card' | 'color' | 'auto';
}) {
  const lower = (name || '').toLowerCase();

  if (lower.includes('bca') || lower.includes('central asia')) {
    return <BcaLogo className={className} variant={variant} />;
  }

  if (lower.includes('mandiri')) {
    return <MandiriLogo className={className} variant={variant} />;
  }

  if (lower.includes('gopay') || lower.includes('go-pay') || lower.includes('goto')) {
    return <GopayLogo className={className} variant={variant} />;
  }

  return null;
}
