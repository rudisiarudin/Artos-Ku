import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Official Bank Central Asia (BCA) Logo
 * Renders in a high-contrast pill container for cards & UI presets
 */
export function BcaLogo({ className = 'h-5 w-auto' }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-white px-1.5 py-0.5 shadow-2xs ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/bca.svg"
        alt="Bank Central Asia"
        className="h-4 w-auto object-contain"
        loading="eager"
      />
    </div>
  );
}

/**
 * Official Bank Mandiri Logo
 * Renders in a high-contrast pill container for cards & UI presets
 */
export function MandiriLogo({ className = 'h-5 w-auto' }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-white px-1.5 py-0.5 shadow-2xs ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/mandiri.svg"
        alt="Bank Mandiri"
        className="h-4 w-auto object-contain"
        loading="eager"
        onError={(e) => {
          // Fallback to high-res PNG if SVG has render quirk
          (e.currentTarget as HTMLImageElement).src = '/logos/mandiri.png';
        }}
      />
    </div>
  );
}

/**
 * Official GoPay Logo
 * Renders in a high-contrast pill container for cards & UI presets
 */
export function GopayLogo({ className = 'h-5 w-auto' }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-white px-2 py-0.5 shadow-2xs ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/gopay.svg"
        alt="GoPay"
        className="h-3.5 w-auto object-contain"
        loading="eager"
        onError={(e) => {
          // Fallback to high-res PNG
          (e.currentTarget as HTMLImageElement).src = '/logos/gopay.png';
        }}
      />
    </div>
  );
}

/**
 * Smart Institution Logo Resolver
 * Automatically selects the official vector logo for recognized institutions/wallets
 */
export function InstitutionLogo({
  name,
  className = 'h-5 w-auto',
}: {
  name: string;
  className?: string;
}) {
  const lower = (name || '').toLowerCase();

  if (lower.includes('bca') || lower.includes('central asia')) {
    return <BcaLogo className={className} />;
  }

  if (lower.includes('mandiri')) {
    return <MandiriLogo className={className} />;
  }

  if (lower.includes('gopay') || lower.includes('go-pay') || lower.includes('goto')) {
    return <GopayLogo className={className} />;
  }

  return null;
}
