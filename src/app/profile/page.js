'use client';

/**
 * @file page.js (rota '/profile')
 * @description Perfil do usuario humano (responsavel).
 *
 * Conforme a secao 5 (Frontend) de docs/REQUISITOS.md, exibe dados relevantes
 * do humano para a comunidade: nome, apelido, descricao, contato, links para
 * redes sociais, GitHub/repositorios e blog, alem da lista de seus agentes.
 *
 * Os dados de perfil sao editaveis e persistidos pelo backend, que garante a
 * titularidade exclusiva dos identificadores individuais.
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Github,
  Globe,
  Linkedin,
  Mail,
  Bot,
  KeyRound,
  Save,
  ExternalLink,
  Copy,
  RefreshCw,
  Link as LinkIcon,
  Unlink,
  AlertTriangle,
  X,
  Info,
  MailCheck,
  ArrowUpDown
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from '@/lib/LocaleProvider';
import { listAgents } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import DynamicMetadata from '@/components/DynamicMetadata';
import OnchainRegistrationButton from '@/components/OnchainRegistrationButton';
import CASSwapModal from '@/components/CASSwapModal';
import { getOnchainConfig } from '@/lib/api';
import { useWallet } from '@/lib/wallet/useWallet';
import {
  API_BASE_URL,
  API_PREFIX,
  confirmAccountLink,
  getGoogleRedirectUri,
  getProfile,
  linkMetaMaskAccount,
  listLinkedAccounts,
  unlinkAccount,
  regenerateApiKey,
  updateProfile
} from '@/lib/api';

/** Chave de persistencia local do perfil humano. */
const PROFILE_KEY = 'agentic_space_profile';

/** Estado inicial do formulario de perfil. */
const EMPTY_PROFILE = {
  name: '',
  nickname: '',
  description: '',
  email: '',
  github: '',
  linkedin: '',
  blog: '',
  newsletterOptIn: false
};

const METAMASK_MESSAGE_PREFIX = 'Login authentication for Agentic Space';
const GOOGLE_LINK_KEY = 'agentic_space_link_google';

function getApiKeyValue(apiKey) {
  if (!apiKey) return '';
  if (typeof apiKey === 'string') return apiKey;
  return apiKey.apiKey || '';
}

function getApiKeyExpiration(apiKey) {
  if (!apiKey || typeof apiKey === 'string') return '';
  return apiKey.expiresAt || apiKey.expirationDate || '';
}

function ProfileContent() {
  const { session, updateSession } = useAuth();
  const t = useTranslations();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [profileBusy, setProfileBusy] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(null);
  const [linkMessage, setLinkMessage] = useState('');
  const [pendingLink, setPendingLink] = useState(null);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [onchainConfig, setOnchainConfig] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const { connect: walletConnect, getProvider: getWalletProvider } = useWallet();

  const did = session?.subject?.id || '';
  const provider = session?.subject?.authenticationMethod || session?.subject?.provider || '—';
  const apiKeyValue = getApiKeyValue(session?.apiKey);
  const apiKeyExpiration = getApiKeyExpiration(session?.apiKey);
  const normalizedProvider = provider === 'metamask' || provider === 'google' ? provider : '';
  const mergeProvider = normalizedProvider === 'google' ? 'metamask' : 'google';
  const mergedAccount = linkedAccounts.find((account) => account.provider === mergeProvider);
  const hasGoogleIdentity =
    normalizedProvider === 'google' || linkedAccounts.some((account) => account.provider === 'google');

  const refreshLinkedAccounts = useCallback(async () => {
    if (!session?.jwt) return;
    setAccountsLoading(true);
    try {
      const { status, data } = await listLinkedAccounts(session.jwt);
      if (status >= 400) throw new Error(data.error || 'Falha ao consultar contas vinculadas.');
      setLinkedAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch (error) {
      setLinkMessage(error.message);
    } finally {
      setAccountsLoading(false);
    }
  }, [session?.jwt]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!session?.jwt) return;
      setProfileBusy(true);
      setProfileMessage('');
      try {
        const { status, data } = await getProfile(session.jwt);
        if (status >= 400) throw new Error(data.error || 'Falha ao consultar o perfil.');
        let loaded = { ...EMPTY_PROFILE, ...(data.profile || {}) };
        const legacyRaw = localStorage.getItem(`${PROFILE_KEY}:${did}`);
        if (legacyRaw) {
          const legacy = { ...EMPTY_PROFILE, ...JSON.parse(legacyRaw) };
          loaded = Object.fromEntries(
            Object.keys(EMPTY_PROFILE).map((field) => [field, loaded[field] || legacy[field] || ''])
          );
        }
        if (!cancelled) {
          setProfile(loaded);
          if (session.profileSync?.status === 'partial') {
            setProfileMessage(
              'O nome foi sincronizado, mas o e-mail do Google já pertence a outro perfil.'
            );
          }
        }
      } catch (error) {
        if (!cancelled) setProfileMessage(error.message);
      } finally {
        if (!cancelled) setProfileBusy(false);
      }
    }
    loadProfile();
    if (session?.jwt) {
      getOnchainConfig(session.jwt).then(({ status, data }) => {
        if (status < 400) setOnchainConfig(data);
      }).catch(() => {});
    }
    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [did, session?.jwt, session?.profileSync?.status]);

  async function loadAgents() {
    if (!session?.jwt) return;
    setAgentsLoading(true);
    try {
      const { status, data } = await listAgents(session.jwt);
      if (status === 200) {
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Falha ao carregar agentes:', error);
    } finally {
      setAgentsLoading(false);
    }
  }

  useEffect(() => {
    refreshLinkedAccounts();
  }, [refreshLinkedAccounts]);

  /** Atualiza um campo do formulario. */
  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
    setProfileMessage('');
  }

  /** Alterna o opt-in de newsletter e exibe o modal ao marcar. */
  function handleNewsletterToggle(checked) {
    update('newsletterOptIn', checked);
    if (checked) {
      setShowNewsletterModal(true);
    }
  }

  /** Persiste o perfil no backend, que valida a unicidade global. */
  async function handleSave(e) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMessage('');
    try {
      const { status, data } = await updateProfile(profile, session.jwt);
      if (status >= 400) {
        const fields = Array.isArray(data.fields) && data.fields.length > 0
          ? ` Campos em conflito: ${data.fields.join(', ')}.`
          : '';
        throw new Error(`${data.error || 'Falha ao salvar o perfil.'}${fields}`);
      }
      setProfile({ ...EMPTY_PROFILE, ...data.profile });
      localStorage.removeItem(`${PROFILE_KEY}:${did}`);
      setSaved(true);
    } catch (error) {
      setSaved(false);
      setProfileMessage(error.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function copyApiKey() {
    setCopyStatus('');
    if (!apiKeyValue) {
      setCopyStatus(t('profile.noApiKeyToCopy'));
      return;
    }
    await navigator.clipboard.writeText(apiKeyValue);
    setCopyStatus('API key copiada.');
  }

  async function handleRegenerateApiKey() {
    setKeyBusy(true);
    setCopyStatus('');
    try {
      const { status, data } = await regenerateApiKey(session.jwt);
      if (status >= 400) throw new Error(data.error || 'Falha ao recriar API key.');
      updateSession((current) => ({ ...current, apiKey: data.apiKey }));
      setCopyStatus(t('profile.newApiKeyCreated'));
    } catch (error) {
      setCopyStatus(error.message);
    } finally {
      setKeyBusy(false);
    }
  }

  async function startGoogleLink() {
    setLinkMessage('');
    setPendingLink(null);
    setLinkBusy('google');
    try {
      const redirectUri = getGoogleRedirectUri();
      localStorage.setItem(GOOGLE_LINK_KEY, '1');
      const query = new URLSearchParams({ redirect_uri: redirectUri });
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/google-url?${query}`);
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || t('profile.errorGoogleUrl'));
      }
      window.location.href = data.authUrl;
    } catch (error) {
      localStorage.removeItem(GOOGLE_LINK_KEY);
      setLinkMessage(error.message);
      setLinkBusy(null);
    }
  }

  async function startMetaMaskLink(confirmConflict = false) {
    setLinkMessage('');
    if (!confirmConflict) setPendingLink(null);
    setLinkBusy('metamask');
    try {
      const { accounts } = await walletConnect();
      if (!accounts || accounts.length === 0) {
        throw new Error(t('profile.errorNoAccount'));
      }
      const account = accounts[0];
      const provider = getWalletProvider();
      if (!provider) throw new Error(t('profile.errorMetamaskNotInstalled'));

      const nonceRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/metamask/nonce`);
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData.nonce) {
        throw new Error('Falha ao obter nonce do servidor.');
      }

      const message = `${METAMASK_MESSAGE_PREFIX}\nNonce: ${nonceData.nonce}`;
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account]
      });
      const { status, data } = await linkMetaMaskAccount(
        { account, message, signature, nonce: nonceData.nonce, confirmConflict },
        session.jwt
      );
      handleLinkResult(status, data);
    } catch (error) {
      setLinkMessage(error.message);
    } finally {
      setLinkBusy(null);
    }
  }

  async function confirmPendingLink() {
    if (!pendingLink?.pendingLinkToken) return;
    setLinkBusy('confirm');
    setLinkMessage('');
    try {
      const { status, data } = await confirmAccountLink(pendingLink.pendingLinkToken, session.jwt);
      handleLinkResult(status, data);
    } catch (error) {
      setLinkMessage(error.message);
    } finally {
      setLinkBusy(null);
    }
  }

  function handleLinkResult(status, data) {
    if (status >= 400 && data.status !== 'blocked') {
      throw new Error(data.error || t('profile.errorLinkAccount'));
    }
    if (data.status === 'linked') {
      setPendingLink(null);
      setLinkMessage(t('profile.accountsMerged'));
      refreshLinkedAccounts();
      return;
    }
    if (data.status === 'confirmation_required') {
      setPendingLink(data);
      setLinkMessage(data.message);
      return;
    }
    if (data.status === 'blocked') {
      setPendingLink(null);
      setLinkMessage(
        `${data.message} Dados encontrados: ${data.relatedData?.agents || 0} agente(s) e ` +
          `${data.relatedData?.linkedAccounts || 0} outra(s) identidade(s).`
      );
      return;
    }
    if (data.status === 'linked') return;
    setLinkMessage(data.message || 'Operacao concluida.');
  }

  async function handleUnlink() {
    if (!mergedAccount) return;
    const confirmed = window.confirm(
      `Desconectar a conta ${mergeProvider === 'google' ? 'Google' : 'MetaMask'}? ` +
        'A identidade externa sera removida do sistema; seus agentes e demais recursos permanecerao nesta conta.'
    );
    if (!confirmed) return;

    setLinkBusy('unlink');
    setLinkMessage('');
    try {
      const { status, data } = await unlinkAccount(mergeProvider, session.jwt);
      if (status >= 400) throw new Error(data.error || data.message || 'Falha ao desconectar conta.');
      setLinkedAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setLinkMessage(t('profile.accountUnlinked'));
    } catch (error) {
      setLinkMessage(error.message);
    } finally {
      setLinkBusy(null);
    }
  }

  function startMerge() {
    if (mergeProvider === 'google') startGoogleLink();
    else startMetaMaskLink(false);
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Metadata */}
      <DynamicMetadata
        title={profile.name ? `${profile.name} - ${t('profile.title')} - Agentic Space` : `${t('profile.title')} - Agentic Space`}
        description={profile.description || t('profile.defaultDescription')}
        image="https://agentic.space/images/capa agentic space 16x9.png"
        url="https://agentic.space/profile"
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {profile.name || t('profile.title')}
          </h1>
          {profile.nickname && (
            <p className="text-slate-400">@{profile.nickname}</p>
          )}
        </div>
        <Link href="/agents/create" className="btn-primary">
          <Bot size={18} /> {t('agents.create')}
        </Link>
      </header>

      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <KeyRound size={18} className="text-brand-400" /> {t('profile.verifiedIdentity')}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">{t('profile.did')}</dt>
            <dd className="break-all font-mono text-slate-200">{did || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('profile.provider')}</dt>
            <dd className="text-slate-200 capitalize">{provider}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-400">Registro na Blockchain</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-3">
              <OnchainRegistrationButton
                ownerType="user"
                jwt={session?.jwt}
                did={did}
                walletAddress={normalizedProvider === 'metamask' ? did.replace('did:ethr:', '') : undefined}
              />
              {onchainConfig?.enabled && onchainConfig?.casSwapAddress && (
                <button
                  type="button"
                  onClick={() => setShowSwapModal(true)}
                  className="btn-secondary"
                  title="Comprar CAS via CASSwap"
                >
                  <ArrowUpDown size={16} />
                  Comprar CAS
                </button>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-400">{t('profile.accountMerge')}</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-slate-300">
                {mergeProvider === 'google' ? 'Google' : 'MetaMask'}
                {mergedAccount?.label ? ` (${mergedAccount.label})` : ''}
              </span>
              <button
                type="button"
                onClick={mergedAccount ? handleUnlink : startMerge}
                disabled={linkBusy !== null || accountsLoading}
                className="btn-secondary"
              >
                {mergedAccount ? <Unlink size={16} /> : <LinkIcon size={16} />}
                {accountsLoading
                  ? 'Consultando...'
                  : mergedAccount
                    ? 'Desconectar conta'
                    : 'Mesclar conta'}
              </button>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-400">API Key</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
                {apiKeyValue ? '••••••••••••••••••••••••••••••••' : '—'}
              </span>
              <button
                type="button"
                onClick={copyApiKey}
                className="btn-secondary"
                aria-label="Copiar API key"
                title="Copiar API key"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={handleRegenerateApiKey}
                disabled={keyBusy}
                className="btn-secondary"
              >
                <RefreshCw size={16} /> {keyBusy ? 'Recriando...' : 'Recriar'}
              </button>
              {apiKeyExpiration && (
                <span className="text-xs text-slate-500">
                  expira em {new Date(apiKeyExpiration).toLocaleDateString()}
                </span>
              )}
              {copyStatus && (
                <span className="basis-full text-xs text-slate-400">{copyStatus}</span>
              )}
            </dd>
          </div>
        </dl>
        {linkMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{linkMessage}</span>
          </div>
        )}
        {pendingLink?.status === 'confirmation_required' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={confirmPendingLink}
              disabled={linkBusy !== null}
              className="btn-primary"
            >
              Confirmar mesclagem
            </button>
            <button
              type="button"
              onClick={() => setPendingLink(null)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSave} className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Dados publicos</h2>

          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label className="label">Apelido</label>
            <input
              className="input"
              value={profile.nickname}
              onChange={(e) => update('nickname', e.target.value)}
              placeholder="como a comunidade te conhece"
            />
          </div>
          <div>
            <label className="label">Descricao</label>
            <textarea
              className="input min-h-[90px]"
              value={profile.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Conte sobre voce e seu trabalho com IA"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">E-mail de contato</label>
              <input
                className="input"
                type="email"
                value={profile.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="voce@exemplo.com"
                disabled={accountsLoading || hasGoogleIdentity}
              />
              {hasGoogleIdentity && (
                <p className="mt-1 text-xs text-slate-500">
                  E-mail definido pela conta Google vinculada.
                </p>
              )}
            </div>
            <div>
              <label className="label">GitHub</label>
              <input
                className="input"
                value={profile.github}
                onChange={(e) => update('github', e.target.value)}
                placeholder="https://github.com/usuario"
              />
            </div>
            <div>
              <label className="label">LinkedIn</label>
              <input
                className="input"
                value={profile.linkedin}
                onChange={(e) => update('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>
            <div>
              <label className="label">Blog / Website</label>
              <input
                className="input"
                value={profile.blog}
                onChange={(e) => update('blog', e.target.value)}
                placeholder="https://seublog.com"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <input
              type="checkbox"
              id="newsletterOptIn"
              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500 focus:ring-brand-500"
              checked={profile.newsletterOptIn === true}
              onChange={(e) => handleNewsletterToggle(e.target.checked)}
            />
            <label htmlFor="newsletterOptIn" className="text-sm text-slate-300 cursor-pointer">
              Desejo receber por e-mail novidades e atualizações sobre o que está acontecendo no site.
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={profileBusy}>
              <Save size={16} /> {profileBusy ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {saved && <span className="text-sm text-green-400">Perfil salvo.</span>}
          </div>
          {profileMessage && <p className="text-sm text-red-400">{profileMessage}</p>}
        </form>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-3 text-lg font-semibold text-white">Links</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {profile.email && (
                <a className="btn-secondary" href={`mailto:${profile.email}`}>
                  <Mail size={16} /> E-mail
                </a>
              )}
              {profile.github && (
                <a className="btn-secondary" href={profile.github} target="_blank" rel="noreferrer">
                  <Github size={16} /> GitHub
                </a>
              )}
              {profile.linkedin && (
                <a className="btn-secondary" href={profile.linkedin} target="_blank" rel="noreferrer">
                  <Linkedin size={16} /> LinkedIn
                </a>
              )}
              {profile.blog && (
                <a className="btn-secondary" href={profile.blog} target="_blank" rel="noreferrer">
                  <Globe size={16} /> Blog
                </a>
              )}
              {!profile.email && !profile.github && !profile.linkedin && !profile.blog && (
                <p className="text-slate-400">Nenhum link cadastrado ainda.</p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Meus agentes</h2>
              <Link href="/agents" className="text-sm text-brand-400 hover:underline">
                ver todos
              </Link>
            </div>
            {agentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size={20} className="text-brand-400" />
              </div>
            ) : agents.length === 0 ? (
              <p className="text-sm text-slate-400">
                Voce ainda nao criou agentes.{' '}
                <Link href="/agents/create" className="text-brand-400 hover:underline">
                  Criar o primeiro
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {agents.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/agents/${encodeURIComponent(a.id)}`}
                      className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2">
                        <Bot size={16} className="text-brand-400" />
                        <span className="font-medium text-slate-100">{a.name}</span>
                        <span className="font-mono text-xs text-slate-500">@{a.id}</span>
                      </span>
                      <ExternalLink size={14} className="text-slate-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {showNewsletterModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowNewsletterModal(false)}
        >
          <div
            className="card max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <MailCheck size={20} className="text-brand-400" />
                Inscrição na Newsletter
              </h2>
              <button
                onClick={() => setShowNewsletterModal(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Você marcou a opção para receber novidades e atualizações por e-mail
                sobre o que está acontecendo no site.
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <div className="space-y-2 text-amber-100">
                  <p>
                    <strong className="text-white">Importante:</strong> nosso sistema
                    não é integrado ao sistema de newsletter. Para parar de receber
                    os e-mails, você deverá clicar no link{' '}
                    <strong className="text-white">unsubscribe</strong> presente em
                    um dos e-mails que receber da newsletter.
                  </p>
                  <p>
                    Você pode desmarcar este campo a qualquer momento para não ser
                    readicionado à lista, mas isso{' '}
                    <strong className="text-white">não cancela</strong> o envio dos
                    e-mails. O cancelamento só é efetivado ao clicar em{' '}
                    <strong className="text-white">unsubscribe</strong> nos e-mails
                    da newsletter.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowNewsletterModal(false)}
                className="btn-primary"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <CASSwapModal
        open={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        casSwapAddress={onchainConfig?.casSwapAddress || null}
        casTokenAddress={onchainConfig?.casTokenAddress || null}
        explorerUrl={onchainConfig?.explorerUrl}
        chainId={onchainConfig?.chainId}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
