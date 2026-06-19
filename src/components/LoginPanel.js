'use client';

/**
 * @file LoginPanel.js
 * @description Painel de autenticacao com Google e MetaMask.
 *
 * Reproduz o fluxo de autenticacao usado pelo `cmd-cli` e pelo backend:
 *  - Google: redireciona para a tela de consentimento OAuth e retorna via
 *    `/auth/google/callback`, onde o `code` e trocado por uma VC assinada.
 *  - MetaMask: solicita conexao da carteira (window.ethereum), assina uma
 *    mensagem e envia conta + assinatura ao servidor para gerar a VC.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL, API_PREFIX, getGoogleRedirectUri } from '@/lib/api';

/** Mensagem assinada na autenticacao MetaMask (igual a POC). */
const METAMASK_MESSAGE = 'Login authentication for Agentic Space';

export default function LoginPanel() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);

  /** Inicia o fluxo OAuth do Google (redirecionamento). */
  async function loginWithGoogle() {
    setError('');
    setLoadingProvider('google');
    try {
      const redirectUri = getGoogleRedirectUri();
      const query = new URLSearchParams({ redirect_uri: redirectUri });
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/google-url?${query}`);
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Falha ao obter URL de autenticacao.');
      }
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  }

  /** Executa a autenticacao via MetaMask e gera a VC no servidor. */
  async function loginWithMetaMask() {
    setError('');
    setLoadingProvider('metamask');
    try {
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask nao esta instalado neste navegador.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada na carteira.');
      }

      const account = accounts[0];
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [METAMASK_MESSAGE, account]
      });

      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, message: METAMASK_MESSAGE, signature })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao gerar credencial.');
      }

      login(data);
      router.push('/profile');
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  }

  return (
    <div className="card mx-auto max-w-md">
      <h2 className="mb-1 text-xl font-semibold text-white">Entrar no Agentic Space</h2>
      <p className="mb-6 text-sm text-slate-400">
        Autentique-se como responsavel para gerenciar seus agentes.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={loginWithGoogle}
          disabled={loadingProvider !== null}
          className="btn w-full border border-slate-700 bg-white text-slate-800 hover:bg-slate-100"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285f4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fbbc05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.27C4.672 5.14 6.656 3.58 9 3.58z" fill="#ea4335" />
          </svg>
          {loadingProvider === 'google' ? 'Redirecionando...' : 'Entrar com Google'}
        </button>

        <button
          onClick={loginWithMetaMask}
          disabled={loadingProvider !== null}
          className="btn w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90"
        >
          <Wallet size={18} />
          {loadingProvider === 'metamask' ? 'Aguardando carteira...' : 'Entrar com MetaMask'}
        </button>
      </div>
    </div>
  );
}
