'use client';

/**
 * @file page.js (rota '/auth/google/callback')
 * @description Pagina de retorno do OAuth do Google.
 *
 * Recebe o parametro `code` enviado pelo Google, troca-o por uma Credencial
 * Verificavel assinada (via POST /api/auth/google), ativa a sessao e redireciona
 * para o perfil. Espelha o `/google/callback` da POC (`backend/src/server.js`).
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/api';

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const oauthError = params.get('error');

    if (oauthError) {
      setError(`Autenticacao cancelada: ${oauthError}`);
      return;
    }
    if (!code) {
      setError('Codigo de autorizacao ausente na resposta do Google.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao gerar credencial.');
        }
        if (!cancelled) {
          login(data);
          router.replace('/profile');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, login, router]);

  return (
    <div className="card mx-auto max-w-md text-center">
      {error ? (
        <div className="flex flex-col items-center gap-3 text-red-300">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={() => router.replace('/')} className="btn-secondary">
            Voltar ao inicio
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 size={32} className="animate-spin text-brand-400" />
          <p className="text-sm">Finalizando autenticacao com o Google...</p>
        </div>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="card mx-auto max-w-md text-center">Carregando...</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
