'use client';

/**
 * @file RequireAuth.js
 * @description Guarda de rota que exige sessao autenticada.
 *
 * Redireciona visitantes nao autenticados para a pagina inicial (login),
 * protegendo as rotas restritas (perfil, agentes, criacao de agente),
 * conforme a preferencia por modulos autenticados.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/lib/auth-context';

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Spinner size={24} />
      </div>
    );
  }

  return children;
}
