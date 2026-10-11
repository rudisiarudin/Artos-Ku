import React from 'react';

export interface LogoProps {
  className?: string;
  variant?: 'card' | 'color' | 'auto';
  alt?: string;
}

/**
 * Official Bank Central Asia (BCA) Logo
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
 * Official Bank Rakyat Indonesia (BRI) Logo
 */
export function BriLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/bri-white.svg' : '/logos/bri.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Bank BRI"
      className={`max-h-5 w-auto object-contain transition-transform duration-200 ${className}`}
      loading="eager"
    />
  );
}

/**
 * Official GoPay Logo
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
 * Official DANA Logo
 */
export function DanaLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/dana-white.svg' : '/logos/dana.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="DANA"
      className={`object-contain transition-transform duration-200 ${className}`}
      loading="eager"
    />
  );
}

/**
 * Official OVO Logo
 */
export function OvoLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
  const isCard = variant === 'card';
  const src = isCard ? '/logos/ovo-white.svg' : '/logos/ovo.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="OVO"
      className={`object-contain transition-transform duration-200 ${className}`}
      loading="eager"
    />
  );
}

/**
 * Smart Institution Logo Resolver
 * Automatically resolves and renders the official borderless logo for Indonesian banks & wallets
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

  if (lower.includes('bri') || lower.includes('rakyat indonesia') || lower.includes('britama')) {
    return <BriLogo className={className} variant={variant} />;
  }

  if (lower.includes('gopay') || lower.includes('go-pay') || lower.includes('goto')) {
    return <GopayLogo className={className} variant={variant} />;
  }

  if (lower.includes('dana')) {
    return <DanaLogo className={className} variant={variant} />;
  }

  if (lower.includes('ovo')) {
    return <OvoLogo className={className} variant={variant} />;
  }

  return null;
}
