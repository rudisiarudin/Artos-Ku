import React from 'react';
import { AuthForm } from '../../components/auth/AuthForm';

export const metadata = {
  title: 'Daftar Akun Baru — ArtosKu',
  description: 'Daftar akun personal finance ArtosKu dengan keamanan cloud Supabase.',
};

export default function RegisterPage() {
  return <AuthForm initialMode="register" />;
}
