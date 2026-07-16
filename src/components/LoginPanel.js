'use client';

/**
 * @file LoginPanel.js
 * @description Painel de autenticacao com Google e MetaMask.
 *
 * Reproduz o fluxo de autenticacao usado pelo `cmd-cli` e pelo backend:
 *  - Google: redireciona para a tela de consentimento OAuth e retorna via
 *    `/auth/google/callback`, onde o `code` e trocado por uma VC assinada.
 *  - MetaMask: solicita conexao da carteira (useWallet hook), assina uma
 *    mensagem e envia conta + assinatura ao servidor para gerar a VC.
 *    No mobile, usa MetaMask SDK (deep link) ou WalletConnect (QR code).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, AlertCircle, Link2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL, API_PREFIX, getGoogleRedirectUri } from '@/lib/api';
import { useTranslations } from '@/lib/LocaleProvider';
import { useWallet } from '@/lib/wallet/useWallet';

/** Prefixo da mensagem assinada na autenticacao MetaMask. */
const METAMASK_MESSAGE_PREFIX = 'Login authentication for Agentic Space';

export default function LoginPanel() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations();
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);
  const { connect, connectWalletConnect, isMobile } = useWallet();

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
        throw new Error(data.error || t('login.errorAuthUrl'));
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
      const { provider, accounts } = await connect();
      if (!accounts || accounts.length === 0) {
        throw new Error(t('login.errorNoAccount'));
      }

      const nonceRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask/nonce`);
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData.nonce) {
        throw new Error('Falha ao obter nonce do servidor.');
      }

      const message = `${METAMASK_MESSAGE_PREFIX}\nNonce: ${nonceData.nonce}`;
      const account = accounts[0];
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account]
      });

      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, message, signature, nonce: nonceData.nonce })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('login.errorCredential'));
      }

      login(data);
      router.push('/profile');
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  }

  /** Conecta via WalletConnect (QR code) para outras carteiras. */
  async function loginWithWalletConnect() {
    setError('');
    setLoadingProvider('walletconnect');
    try {
      const { provider, accounts } = await connectWalletConnect();
      if (!accounts || accounts.length === 0) {
        throw new Error(t('login.errorNoAccount'));
      }

      const nonceRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask/nonce`);
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData.nonce) {
        throw new Error('Falha ao obter nonce do servidor.');
      }

      const message = `${METAMASK_MESSAGE_PREFIX}\nNonce: ${nonceData.nonce}`;
      const account = accounts[0];
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account]
      });

      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, message, signature, nonce: nonceData.nonce })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('login.errorCredential'));
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
      <h2 className="mb-1 text-xl font-semibold text-white">{t('login.title')}</h2>
      <p className="mb-6 text-sm text-slate-400">
        {t('login.description')}
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
          {loadingProvider === 'google' ? t('login.redirecting') : t('login.google')}
        </button>

        <button
          onClick={loginWithMetaMask}
          disabled={loadingProvider !== null}
          className="btn w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90"
        >
          <Wallet size={18} />
          {loadingProvider === 'metamask' ? t('login.waitingWallet') : t('login.metamask')}
        </button>

        {isMobile && (
          <button
            onClick={loginWithWalletConnect}
            disabled={loadingProvider !== null}
            className="btn w-full border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
          >
            <Link2 size={18} />
            {loadingProvider === 'walletconnect' ? t('login.waitingWallet') : 'WalletConnect'}
          </button>
        )}
      </div>
    </div>
  );
}
