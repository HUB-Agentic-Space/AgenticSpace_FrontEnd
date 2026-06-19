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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { listAgents } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
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
  blog: ''
};

const METAMASK_MESSAGE = 'Login authentication for Agentic Space';
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
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [agents, setAgents] = useState([]);
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
    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [did, session?.jwt, session?.profileSync?.status]);

  async function loadAgents() {
    if (!session?.jwt) return;
    try {
      const { status, data } = await listAgents(session.jwt);
      if (status === 200) {
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Falha ao carregar agentes:', error);
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
      setCopyStatus('Nenhuma API key ativa nesta sessao. Recrie a chave para copiar.');
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
      setCopyStatus('Nova API key criada. Use o icone de copiar para leva-la ao clipboard.');
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
        throw new Error(data.error || 'Falha ao obter URL do Google.');
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
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask nao esta instalado neste navegador.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada na carteira.');
      }
      const account = accounts[0];
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [METAMASK_MESSAGE, account]
      });
      const { status, data } = await linkMetaMaskAccount(
        { account, message: METAMASK_MESSAGE, signature, confirmConflict },
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
      throw new Error(data.error || 'Falha ao conectar conta.');
    }
    if (data.status === 'linked') {
      setPendingLink(null);
      setLinkMessage('Contas mescladas. Os recursos permanecem com o usuario desta sessao.');
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
      setLinkMessage('Conta desconectada e removida do sistema. Seus recursos foram preservados.');
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {profile.name || 'Meu Perfil'}
          </h1>
          {profile.nickname && (
            <p className="text-slate-400">@{profile.nickname}</p>
          )}
        </div>
        <Link href="/agents/create" className="btn-primary">
          <Bot size={18} /> Criar agente
        </Link>
      </header>

      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <KeyRound size={18} className="text-brand-400" /> Identidade verificada
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">DID</dt>
            <dd className="break-all font-mono text-slate-200">{did || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Provedor</dt>
            <dd className="text-slate-200 capitalize">{provider}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-400">Mesclagem de contas</dt>
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
            {agents.length === 0 ? (
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
