import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Official Bank Central Asia (BCA) Logo
 * Renders in an optimal contrast pill for physical card & UI presets
 */
export function BcaLogo({ className = 'h-5 w-auto', variant = 'auto' }: LogoProps) {
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
 * Helper to display bank or wallet logo badges
 */
export function InstitutionLogo({
  name,
  className = 'h-5 w-auto',
}: {
  name: string;
  className?: string;
}) {
  const lower = name.toLowerCase();

  if (lower.includes('bca') || lower.includes('central asia')) {
    return <BcaLogo className={className} />;
  }

  // Fallback text badge for others
  return (
    <span className="font-extrabold tracking-wider uppercase text-xs">
      {name}
    </span>
  );
}
