'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { BrandLogo } from '../shared/BrandLogo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface AuthFormProps {
  initialMode?: 'login' | 'register';
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const router = useRouter();
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
            setMessage('Pendaftaran akun berhasil! Mengalihkan ke dasbor...');
            setTimeout(() => {
              router.push('/');
              router.refresh();
            }, 800);
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

          setMessage('Login berhasil! Mengalihkan ke dasbor...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 600);
        }
      } else {
        setMessage('Database offline/demo aktif. Mengalihkan ke dasbor...');
        setTimeout(() => {
          router.push('/');
        }, 600);
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Gagal memproses autentikasi.'));
    } finally {
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
          <div className="mt-2 flex items-center gap-2">
            {isSupabaseConfigured() ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Supabase Auth Cloud Aktif</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Mode Offline / Demo</span>
              </Badge>
            )}
          </div>
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
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Atau Masuk Cepat
                    </span>
                  </div>
                </div>

                {/* Quick Demo Mode */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full gap-2 rounded-xl py-2.5 text-xs font-semibold hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Jelajahi Langsung (Mode Demo)</span>
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
