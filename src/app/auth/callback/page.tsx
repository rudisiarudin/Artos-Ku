'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/db/supabase';
import { BrandLogo } from '../../../components/shared/BrandLogo';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuthCallback = async () => {
      try {
        if (!supabase) {
          router.push('/login');
          return;
        }

        // Check if session is already established or hash was parsed
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          const onboarded =
            typeof window !== 'undefined' &&
            localStorage.getItem('artosku_onboarding_completed') === 'true';

          if (isMounted) {
            router.push(onboarded ? '/' : '/onboarding');
            router.refresh();
          }
          return;
        }

        // Listen for token exchange event from Supabase OAuth hash/code
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            if (currentSession && isMounted) {
              const onboarded =
                typeof window !== 'undefined' &&
                localStorage.getItem('artosku_onboarding_completed') === 'true';

              router.push(onboarded ? '/' : '/onboarding');
              router.refresh();
            }
          }
        );

        // Fallback timer
        const timer = setTimeout(() => {
          if (isMounted) {
            router.push('/');
          }
        }, 3000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Gagal memproses autentikasi Google.');
          setTimeout(() => router.push('/login'), 2500);
        }
      }
    };

    processAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <BrandLogo size="lg" showText={true} />

        {errorMessage ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive mt-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage} Mengalihkan ke login...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground mt-4 rounded-full border border-border/70 bg-muted/40 px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Menghubungkan akun Google Anda...</span>
          </div>
        )}
      </div>
    </div>
  );
}
