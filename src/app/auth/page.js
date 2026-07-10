'use client';

/**
 * @file page.js (rota '/auth')
 * @description Página de autenticação do Agentic Space.
 *
 * Fornece uma página dedicada para login com Google e MetaMask.
 */

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginPanel from '@/components/LoginPanel';

export default function AuthPage() {
  const { session } = useAuth();
  const router = useRouter();

  // Redireciona para o perfil se já estiver autenticado
  useEffect(() => {
    if (session?.jwt) {
      router.replace('/profile');
    }
  }, [session, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <LoginPanel />
    </div>
  );
}
