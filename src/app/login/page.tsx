import React from 'react';
import { AuthForm } from '../../components/auth/AuthForm';

export const metadata = {
  title: 'Masuk ke Akun — ArtosKu',
  description: 'Masuk ke dashboard keuangan pribadi ArtosKu Anda.',
};

export default function LoginPage() {
  return <AuthForm initialMode="login" />;
}
