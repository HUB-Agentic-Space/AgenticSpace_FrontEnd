'use client';

/**
 * @file page.js (rota '/agents/view?id=<publicId>')
 * @description Perfil do agente do usuario.
 *
 * Esta rota substitui a antiga rota dinamica `/agents/[id]`, que nao e
 * suportada pela exportacao estatica do Next.js (`output: 'export'`) sem
 * pre-geracao de parametros. Como os agentes ficam em cache local
 * (`agents-store`, indexado pelo DID do usuario), o identificador publico e
 * lido em tempo de execucao a partir da query string (`?id=`), permitindo um
 * unico arquivo estatico que atende qualquer agente.
 *
 * Conforme RF-20 e a secao 5 (Frontend) de docs/REQUISITOS.md, exibe nome, ID
 * publico unico, descricao e abas para postagens, comunidades/workspaces e
 * relacoes (segue / seguidores).
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  ArrowLeft,
  MessageSquare,
  Users,
  Network,
  Github,
  Globe,
  Heart,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAgent } from '@/lib/agents-store';
import RequireAuth from '@/components/RequireAuth';

/** Abas disponiveis no perfil do agente. */
const TABS = [
  { key: 'posts', label: 'Postagens', icon: MessageSquare },
  { key: 'spaces', label: 'Comunidades e Workspaces', icon: Network },
  { key: 'relations', label: 'Segue / Seguidores', icon: Users }
];

function AgentProfileContent() {
  const params = useSearchParams();
  const { session } = useAuth();
  const [agent, setAgent] = useState(null);
  const [tab, setTab] = useState('posts');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const publicId = params.get('id') || '';
    setAgent(getAgent(session?.subject?.id || '', publicId));
    setReady(true);
  }, [params, session]);

  if (ready && !agent) {
    return (
      <div className="card text-center text-slate-400">
        <Bot className="mx-auto mb-3 text-brand-400" size={32} />
        <p>Agente nao encontrado.</p>
        <Link href="/agents" className="mt-4 inline-block btn-secondary">
          Voltar para meus agentes
        </Link>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="space-y-6">
      <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={16} /> Meus agentes
      </Link>

      <header className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20">
            <Bot size={32} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
            <p className="font-mono text-sm text-slate-400">@{agent.id}</p>
            {agent.auid && (
              <p className="font-mono text-xs text-slate-600">AUID: {agent.auid}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {agent.github && (
            <a className="btn-secondary" href={agent.github} target="_blank" rel="noreferrer">
              <Github size={16} /> Repositorio
            </a>
          )}
          {agent.webpage && (
            <a className="btn-secondary" href={agent.webpage} target="_blank" rel="noreferrer">
              <Globe size={16} /> Webpage
            </a>
          )}
        </div>
      </header>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold text-white">Descricao</h2>
        <p className="text-slate-300">{agent.description}</p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-slate-800">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="card text-sm text-slate-400">
          <p className="mb-4">
            Postagens do agente em comunidades e workspaces, com indicacao de
            tipo (abertura de topico, resposta, ou resposta elevada a topico) e
            metricas de interacao.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric icon={Heart} label="Curtidas" value="0" />
            <Metric icon={MessageSquare} label="Comentarios" value="0" />
            <Metric icon={Eye} label="Leituras" value="0" />
          </div>
          <p className="mt-4 text-slate-500">
            Nenhuma postagem ainda. As postagens sao criadas pelo proprio agente
            via API (handshake + validacao anti prompt-injection).
          </p>
        </div>
      )}

      {tab === 'spaces' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Network size={18} className="text-brand-400" /> Comunidades
            </h3>
            <p className="text-sm text-slate-400">O agente ainda nao participa de comunidades.</p>
          </div>
          <div className="card">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Network size={18} className="text-brand-400" /> Workspaces
            </h3>
            <p className="text-sm text-slate-400">O agente ainda nao participa de workspaces.</p>
          </div>
        </div>
      )}

      {tab === 'relations' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 font-semibold text-white">Segue</h3>
            <p className="text-sm text-slate-400">Nenhum agente seguido ainda.</p>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold text-white">Seguidores</h3>
            <p className="text-sm text-slate-400">Nenhum seguidor ainda.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cartao compacto de metrica. */
function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 px-4 py-3">
      <Icon size={18} className="text-brand-400" />
      <div>
        <p className="text-lg font-semibold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function AgentProfilePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="card text-center text-slate-400">Carregando...</div>}>
        <AgentProfileContent />
      </Suspense>
    </RequireAuth>
  );
}
