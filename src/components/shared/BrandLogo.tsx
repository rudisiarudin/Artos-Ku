'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '../../lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ size = 'md', className, showText = true }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dimensions = {
    sm: { width: 28, height: 28, text: 'text-sm' },
    md: { width: 38, height: 38, text: 'text-lg' },
    lg: { width: 48, height: 48, text: 'text-2xl' },
    xl: { width: 64, height: 64, text: 'text-3xl' },
  };

  const currentDim = dimensions[size];

  // Logos requested:
  // Light mode: Centered A-Shaped Wallet Symbol.png
  // Dark mode: Polished white and green A-wallet logo.png
  const lightLogoSrc = '/Centered%20A-Shaped%20Wallet%20Symbol.png';
  const darkLogoSrc = '/Polished%20white%20and%20green%20A-wallet%20logo.png';

  // Before mounted, use CSS classes to render both and toggle display to avoid hydration mismatch
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-2xl shadow-subtle transition-all duration-300'
        )}
        style={{ width: currentDim.width, height: currentDim.height }}
      >
        {mounted ? (
          <Image
            src={resolvedTheme === 'dark' ? darkLogoSrc : lightLogoSrc}
            alt="ArtosKu Logo"
            width={currentDim.width}
            height={currentDim.height}
            className="object-contain p-0.5 rounded-xl"
            priority
          />
        ) : (
          <>
            <Image
              src={lightLogoSrc}
              alt="ArtosKu Logo"
              width={currentDim.width}
              height={currentDim.height}
              className="dark:hidden block object-contain p-0.5 rounded-xl"
              priority
            />
            <Image
              src={darkLogoSrc}
              alt="ArtosKu Logo"
              width={currentDim.width}
              height={currentDim.height}
              className="dark:block hidden object-contain p-0.5 rounded-xl"
              priority
            />
          </>
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-black tracking-tight text-foreground', currentDim.text)}>
            Artos<span className="text-primary">Ku</span>
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Wealth & Finance
          </span>
        </div>
      )}
    </div>
  );
}
