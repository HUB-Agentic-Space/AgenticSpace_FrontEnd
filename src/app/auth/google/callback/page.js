'use client';

/**
 * @file page.js (rota '/auth/google/callback')
 * @description Pagina de retorno do OAuth do Google.
 *
 * Recebe o parametro `code` enviado pelo Google, troca-o por uma Credencial
 * Verificavel assinada (via POST /api/auth/google), ativa a sessao e redireciona
 * para o perfil. Espelha o callback Google usado pelo `cmd-cli`.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  API_BASE_URL,
  confirmAccountLink,
  getGoogleRedirectUri,
  linkGoogleAccount
} from '@/lib/api';

const GOOGLE_LINK_KEY = 'agentic_space_link_google';

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, loading, login } = useAuth();
  const [error, setError] = useState('');
  const [pendingLink, setPendingLink] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (loading) return undefined;
    if (processedRef.current) return undefined;

    const code = params.get('code');
    const oauthError = params.get('error');
    const isLinkFlow =
      typeof window !== 'undefined' && localStorage.getItem(GOOGLE_LINK_KEY) === '1';

    if (oauthError) {
      setError(`Autenticacao cancelada: ${oauthError}`);
      return;
    }
    if (!code) {
      setError('Codigo de autorizacao ausente na resposta do Google.');
      return;
    }
    processedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const redirectUri = getGoogleRedirectUri();
        if (isLinkFlow) {
          if (!session?.jwt) {
            throw new Error('Sessao atual ausente para conectar a conta Google.');
          }
          const { status, data } = await linkGoogleAccount({ code, redirectUri }, session.jwt);
          if (status >= 400 && data.status !== 'blocked') {
            throw new Error(data.error || 'Falha ao conectar conta Google.');
          }
          localStorage.removeItem(GOOGLE_LINK_KEY);
          if (!cancelled) {
            if (data.status === 'linked') {
              router.replace('/profile');
              return;
            }
            if (data.status === 'confirmation_required') {
              setPendingLink(data);
              return;
            }
            if (data.status === 'blocked') {
              setError(
                `${data.message} Dados encontrados: ${data.relatedData?.agents || 0} agente(s) e ` +
                  `${data.relatedData?.linkedAccounts || 0} outra(s) identidade(s).`
              );
              return;
            }
            setError(data.message || 'Nao foi possivel conectar a conta Google.');
          }
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri })
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
  }, [params, loading, session?.jwt, login, router]);

  async function confirmPendingLink() {
    try {
      const { status, data } = await confirmAccountLink(pendingLink.pendingLinkToken, session.jwt);
      if (status >= 400) throw new Error(data.error || data.message || 'Falha ao confirmar vinculo.');
      router.replace('/profile');
    } catch (err) {
      setError(err.message);
      setPendingLink(null);
    }
  }

  return (
    <div className="card mx-auto max-w-md text-center">
      {pendingLink ? (
        <div className="flex flex-col items-center gap-3 text-amber-100">
          <AlertCircle size={32} />
          <p className="text-sm">{pendingLink.message}</p>
          <button onClick={confirmPendingLink} className="btn-primary">
            Confirmar mesclagem
          </button>
          <button onClick={() => router.replace('/profile')} className="btn-secondary">
            Cancelar
          </button>
        </div>
      ) : error ? (
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
