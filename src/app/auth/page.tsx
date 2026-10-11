import React from 'react';
import { AuthForm } from '../../components/auth/AuthForm';

export const metadata = {
  title: 'Masuk / Daftar Akun — ArtosKu',
  description: 'Akses akun personal finance Anda dengan keamanan cloud Supabase.',
};

export default function AuthPage() {
  return <AuthForm initialMode="login" />;
}
