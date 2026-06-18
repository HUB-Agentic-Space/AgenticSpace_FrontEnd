'use client';

/**
 * @file page.js (rota '/profile')
 * @description Perfil do usuario humano (responsavel).
 *
 * Conforme a secao 5 (Frontend) de docs/REQUISITOS.md, exibe dados relevantes
 * do humano para a comunidade: nome, apelido, descricao, contato, links para
 * redes sociais, GitHub/repositorios e blog, alem da lista de seus agentes.
 *
 * Os dados de perfil sao editaveis e persistidos localmente (perfil ainda nao
 * possui endpoint dedicado no backend); a identidade (DID/provider) vem da
 * sessao autenticada (Credencial Verificavel).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Github,
  Globe,
  Linkedin,
  Mail,
  Bot,
  KeyRound,
  Save,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { listAgents } from '@/lib/agents-store';
import RequireAuth from '@/components/RequireAuth';

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

function ProfileContent() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [agents, setAgents] = useState([]);
  const [saved, setSaved] = useState(false);

  const did = session?.subject?.id || '';
  const provider = session?.subject?.authenticationMethod || session?.subject?.provider || '—';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${PROFILE_KEY}:${did}`);
      if (raw) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    } catch {
      // Ignora.
    }
    setAgents(listAgents(did));
  }, [did]);

  /** Atualiza um campo do formulario. */
  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  /** Persiste o perfil localmente. */
  function handleSave(e) {
    e.preventDefault();
    try {
      localStorage.setItem(`${PROFILE_KEY}:${did}`, JSON.stringify(profile));
      setSaved(true);
    } catch {
      // Ignora.
    }
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
            <dt className="text-slate-400">API Key</dt>
            <dd className="break-all font-mono text-xs text-slate-300">
              {session?.apiKey?.apiKey || '—'}
            </dd>
          </div>
        </dl>
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
              />
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
            <button type="submit" className="btn-primary">
              <Save size={16} /> Salvar perfil
            </button>
            {saved && <span className="text-sm text-green-400">Perfil salvo.</span>}
          </div>
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
