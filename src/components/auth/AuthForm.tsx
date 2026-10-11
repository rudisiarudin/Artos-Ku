'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  HelpCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/db/supabase';
import { useFinance } from '../../context/FinanceContext';
import { BrandLogo } from '../shared/BrandLogo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface AuthFormProps {
  initialMode?: 'login' | 'register';
}

function AuthFormInner({ initialMode = 'login' }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasCompletedOnboarding } = useFinance();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Listen for redirected auth errors (e.g., Google account not registered yet)
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    const emailParam = searchParams?.get('email');
    if (errorParam === 'google_account_not_found') {
      setError(
        emailParam
          ? `Akun Google (${emailParam}) belum terdaftar di ArtosKu. Silakan lakukan pendaftaran akun (Register) terlebih dahulu.`
          : 'Akun Google ini belum terdaftar di ArtosKu. Silakan lakukan pendaftaran akun (Register) terlebih dahulu.'
      );
      setIsSignUp(true);
    }
  }, [searchParams]);

  const translateAuthError = (errMsg: string) => {
    const lower = errMsg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Email atau kata sandi yang Anda masukkan salah.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'Email ini sudah terdaftar. Silakan pilih tab Masuk (Login).';
    }
    if (lower.includes('password should be at least')) {
      return 'Kata sandi minimal harus 6 karakter.';
    }
    if (lower.includes('valid email')) {
      return 'Format alamat email tidak valid.';
    }
    return errMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isSignUp && password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Mohon periksa kembali.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured() && supabase) {
        if (isSignUp) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

          if (signUpError) throw signUpError;

          if (data.session) {
            const nextRoute = hasCompletedOnboarding ? '/' : '/onboarding';
            setMessage(
              hasCompletedOnboarding
                ? 'Pendaftaran akun berhasil! Mengalihkan ke dasbor...'
                : 'Pendaftaran akun berhasil! Mengalihkan ke orientasi dompet...'
            );
            setTimeout(() => {
              router.push(nextRoute);
              router.refresh();
            }, 700);
          } else {
            setMessage(
              'Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan cek kotak masuk Anda.'
            );
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInError) throw signInError;

          const nextRoute = hasCompletedOnboarding ? '/' : '/onboarding';
          setMessage(
            hasCompletedOnboarding
              ? 'Login berhasil! Mengalihkan ke dasbor...'
              : 'Login berhasil! Menyiapkan orientasi dompet pertama...'
          );
          setTimeout(() => {
            router.push(nextRoute);
            router.refresh();
          }, 600);
        }
      } else {
        setError('Koneksi Supabase belum terkonfigurasi pada file .env.');
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Gagal memproses autentikasi.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);

    const intent = isSignUp ? 'register' : 'login';

    try {
      if (isSupabaseConfigured() && supabase) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('artosku_auth_intent', intent);
        }

        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?intent=${intent}`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (oauthError) throw oauthError;
      } else {
        setError('Koneksi Supabase belum terkonfigurasi pada file .env.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Gagal autentikasi dengan Google.'));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Mohon masukkan alamat email Anda terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isSupabaseConfigured() && supabase) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (resetError) throw resetError;
        setResetSent(true);
      } else {
        setError('Supabase Auth belum diatur pada environment project.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim email reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="xl" showText={true} />
          <p className="mt-2 text-xs text-muted-foreground">
            Platform Manajemen Keuangan Pribadi, Portofolio Saham IDX & Crypto
          </p>
        </div>

        {/* Auth Card */}
        <Card className="rounded-2xl border border-border shadow-lg">
          <CardContent className="p-6">
            {!isResetMode ? (
              <>
                {/* Switcher Tabs */}
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError('');
                      setMessage('');
                    }}
                    className={`rounded-lg py-2.5 text-xs font-bold transition ${
                      !isSignUp
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Masuk (Login)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      setMessage('');
                    }}
                    className={`rounded-lg py-2.5 text-xs font-bold transition ${
                      isSignUp
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Daftar (Register)
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {message && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Nama Lengkap
                      </label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          required
                          placeholder="Budi Santoso"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-9 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Alamat Email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Kata Sandi (Password)
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setIsResetMode(true)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Konfirmasi Kata Sandi
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Ulangi kata sandi"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9 pr-10 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full gap-2 rounded-xl py-3 text-sm font-bold shadow-sm"
                  >
                    <span>
                      {isLoading
                        ? 'Memproses...'
                        : isSignUp
                        ? 'Daftar Akun Baru'
                        : 'Masuk ke ArtosKu'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Atau Lanjutkan Dengan
                    </span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full gap-2.5 rounded-xl py-3 text-xs font-bold hover:bg-muted/80 border-border/80 shadow-xs"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isSignUp ? 'Daftar dengan Google' : 'Masuk dengan Google'}</span>
                </Button>
              </>
            ) : (
              /* Forgot Password Reset Form */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-foreground">Pemulihan Kata Sandi</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Masukkan email Anda untuk menerima tautan pemulihan kata sandi akun Supabase.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {resetSent ? (
                  <div className="space-y-3 rounded-xl bg-emerald-500/10 p-4 text-center text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="mx-auto h-6 w-6" />
                    <p className="font-semibold">
                      Tautan pemulihan telah dikirim ke <b>{email}</b>.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Silakan periksa kotak masuk atau spam email Anda.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsResetMode(false);
                        setResetSent(false);
                      }}
                      className="mt-2 w-full text-xs"
                    >
                      Kembali ke Halaman Masuk
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Alamat Email
                      </label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          placeholder="nama@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full gap-2 rounded-xl py-2.5 text-xs font-bold"
                    >
                      <span>{isLoading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsResetMode(false)}
                      className="w-full text-xs text-muted-foreground"
                    >
                      Batal & Kembali ke Login
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-xs text-muted-foreground">
          Memuat formulir autentikasi...
        </div>
      }
    >
      <AuthFormInner {...props} />
    </Suspense>
  );
}
