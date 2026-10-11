'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/db/supabase';
import { storage } from '../../../lib/db/storage';
import { BrandLogo } from '../../../components/shared/BrandLogo';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuthCallback = async () => {
      try {
        if (!supabase) {
          router.push('/login');
          return;
        }

        const client = supabase;

        // 1. Identify intent (login vs register) from URL query or localStorage
        const queryIntent = searchParams.get('intent');
        const storedIntent =
          typeof window !== 'undefined' ? localStorage.getItem('artosku_auth_intent') : null;
        const intent = queryIntent || storedIntent || 'login';

        // Clear stored intent
        if (typeof window !== 'undefined') {
          localStorage.removeItem('artosku_auth_intent');
        }

        const handleUserSession = async (currentSession: any) => {
          if (!currentSession?.user) {
            router.push('/login');
            return;
          }

          const user = currentSession.user;
          const userCreatedAt = new Date(user.created_at).getTime();
          // User was created during this specific OAuth flow if created within 75 seconds
          const isBrandNewAuthUser = Date.now() - userCreatedAt < 75000;

          // Check if this user already has wallets/accounts setup in ArtosKu
          const { count: accountCount } = await client
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const localAccs = await storage.getAccounts();
          const hasLocalAccounts = localAccs.filter((a) => a.user_id !== 'default-user').length > 0;
          const isMetadataOnboarded = Boolean(user.user_metadata?.onboarding_completed);
          const hasExistingAccounts = (accountCount ?? 0) > 0;

          const isExistingUser =
            !isBrandNewAuthUser || hasExistingAccounts || hasLocalAccounts || isMetadataOnboarded;

          // RULE: Jika akun belum ada di ArtosKu, login via Google harus register dulu
          if (intent === 'login' && !isExistingUser) {
            // Revoke current session so user is not logged in
            await client.auth.signOut();

            if (isMounted) {
              setErrorMessage('Akun belum terdaftar. Mengalihkan ke halaman registrasi...');
              setTimeout(() => {
                const emailParam = encodeURIComponent(user.email || '');
                router.push(`/register?error=google_account_not_found&email=${emailParam}`);
              }, 1000);
            }
            return;
          }

          // Allowed: either existing user logging in, or user registering with Google
          const onboarded =
            hasExistingAccounts ||
            hasLocalAccounts ||
            isMetadataOnboarded ||
            (typeof window !== 'undefined' &&
              (localStorage.getItem('artosku_onboarding_completed') === 'true' ||
                localStorage.getItem(`artosku_onboarded_${user.id}`) === 'true'));

          if (isMounted) {
            router.push(onboarded ? '/' : '/onboarding');
            router.refresh();
          }
        };

        // Check if session is already active
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          await handleUserSession(session);
          return;
        }

        // Listen for token exchange event from Supabase OAuth
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession && isMounted) {
            await handleUserSession(currentSession);
          }
        });

        // Safety fallback timer
        const timer = setTimeout(() => {
          if (isMounted) {
            router.push('/login');
          }
        }, 5000);

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
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <BrandLogo size="lg" showText={true} />

      {errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive mt-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground mt-4 rounded-full border border-border/70 bg-muted/40 px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Menghubungkan akun Google Anda...</span>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Memverifikasi akun...</span>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
