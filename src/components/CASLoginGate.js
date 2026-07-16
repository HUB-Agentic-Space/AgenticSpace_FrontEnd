'use client';

/**
 * @file CASLoginGate.js
 * @description Modal que convida o usuário a autenticar-se antes de comprar CAS.
 *              Oferece login via Google (OAuth) e/ou MetaMask, com explicação
 *              de segurança e consentimento de dados. O usuário pode optar por
 *              apenas MetaMask.
 *
 * Padrão: Strategy (escolha de provedor de autenticação)
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X, Shield, Mail, Wallet, AlertCircle, Loader2,
  CheckCircle, Lock, ArrowRight, Info, Link2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from '@/lib/LocaleProvider';
import { API_BASE_URL, API_PREFIX, getGoogleRedirectUri } from '@/lib/api';
import { useWallet } from '@/lib/wallet/useWallet';

const METAMASK_MESSAGE = 'Login authentication for Agentic Space';

export default function CASLoginGate({ open, onClose, onSuccess }) {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState('welcome');
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { connect, connectWalletConnect, isMobile } = useWallet();

  useState(() => {
    if (open) setMounted(true);
  }, [open]);

  if (typeof window !== 'undefined' && !mounted && open) {
    setMounted(true);
  }

  if (!mounted || !open) return null;

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

  async function loginWithMetaMask() {
    setError('');
    setLoadingProvider('metamask');
    try {
      const { provider, accounts } = await connect();
      if (!accounts || accounts.length === 0) {
        throw new Error(t('login.errorNoAccount'));
      }

      const account = accounts[0];
      const signature = await provider.request({
        method: 'personal_sign',
        params: [METAMASK_MESSAGE, account],
      });

      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, message: METAMASK_MESSAGE, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('login.errorCredential'));
      }

      login(data);
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  }

  async function loginWithWalletConnect() {
    setError('');
    setLoadingProvider('walletconnect');
    try {
      const { provider, accounts } = await connectWalletConnect();
      if (!accounts || accounts.length === 0) {
        throw new Error(t('login.errorNoAccount'));
      }

      const account = accounts[0];
      const signature = await provider.request({
        method: 'personal_sign',
        params: [METAMASK_MESSAGE, account],
      });

      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, message: METAMASK_MESSAGE, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('login.errorCredential'));
      }

      login(data);
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  }

  function handleSkip() {
    onClose();
    router.push('/auth');
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('casToken.loginGate.title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {step === 'welcome' && (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-brand-500/10 p-4 border border-brand-500/20">
                <Shield className="text-brand-400 shrink-0 mt-0.5" size={20} />
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">{t('casToken.loginGate.securityReason')}</p>
                  <p className="text-sm text-slate-300">{t('casToken.loginGate.agentProtection')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-4">
                <Lock className="text-slate-400 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">{t('casToken.loginGate.privacyTitle')}</p>
                  <p className="text-xs text-slate-400">{t('casToken.loginGate.privacyText')}</p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                <p className="text-sm font-medium text-white">{t('casToken.loginGate.stepsTitle')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">1</span>
                    {t('casToken.loginGate.step1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">2</span>
                    {t('casToken.loginGate.step2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">3</span>
                    {t('casToken.loginGate.step3')}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-300">{t('casToken.loginGate.newsletterOptIn')}</span>
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={loginWithGoogle}
                  disabled={loadingProvider !== null}
                  className="btn w-full border border-slate-700 bg-white text-slate-800 hover:bg-slate-100"
                >
                  {loadingProvider === 'google' ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('login.redirecting')}</>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285f4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853" />
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fbbc05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.27C4.672 5.14 6.656 3.58 9 3.58z" fill="#ea4335" />
                      </svg>
                      {t('casToken.loginGate.loginGoogle')}
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-700" />
                  <span className="text-xs text-slate-500">{t('casToken.loginGate.or')}</span>
                  <div className="h-px flex-1 bg-slate-700" />
                </div>

                <button
                  onClick={loginWithMetaMask}
                  disabled={loadingProvider !== null}
                  className="btn w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90"
                >
                  {loadingProvider === 'metamask' ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('login.waitingWallet')}</>
                  ) : (
                    <><Wallet size={18} /> {t('casToken.loginGate.loginMetamaskOnly')}</>
                  )}
                </button>

                {isMobile && (
                  <button
                    onClick={loginWithWalletConnect}
                    disabled={loadingProvider !== null}
                    className="btn w-full border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    {loadingProvider === 'walletconnect' ? (
                      <><Loader2 size={18} className="animate-spin" /> {t('login.waitingWallet')}</>
                    ) : (
                      <><Link2 size={18} /> WalletConnect</>
                    )}
                  </button>
                )}

                <p className="text-center text-xs text-slate-500 pt-1">
                  {t('casToken.loginGate.metamaskOnlyNote')}
                </p>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="text-green-400" size={48} />
            <p className="text-lg font-semibold text-white">{t('casToken.loginGate.successTitle')}</p>
            <p className="text-sm text-slate-400">{t('casToken.loginGate.successText')}</p>
            <div className="flex items-center gap-2 text-brand-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">{t('casToken.loginGate.redirecting')}</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
