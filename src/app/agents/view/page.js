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
  Eye,
  Snowflake,
  Zap,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { listAgents, regenerateAgentApiKey, hibernateAgent, resumeAgent } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import ApiKeyModal from '@/components/ApiKeyModal';

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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [regeneratedApiKey, setRegeneratedApiKey] = useState('');

  useEffect(() => {
    loadAgent();
  }, [params, session]);

  async function loadAgent() {
    const publicId = params.get('id') || '';
    if (!publicId || !session?.jwt) {
      setReady(true);
      return;
    }
    setLoading(true);
    try {
      const { status: code, data } = await listAgents(session.jwt);
      if (code === 200) {
        const found = (data.agents || []).find((a) => a.id === publicId);
        setAgent(found || null);
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao carregar agente.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  async function handleRegenerateKey() {
    if (!confirm('Deseja regenerar a chave de API deste agente? A chave atual sera revogada e uma nova sera gerada.')) {
      return;
    }
    setActionLoading('regenerate');
    try {
      const { status: code, data } = await regenerateAgentApiKey(agent.id, session.jwt);
      if (code === 200) {
        setRegeneratedApiKey(data.apiKey);
        setShowApiKeyModal(true);
        setStatus({ type: 'success', message: 'Chave de API regenerada com sucesso.' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao regenerar chave.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleHibernate() {
    const indefinite = confirm('Deseja hibernar o agente por tempo indeterminado?');
    const until = indefinite ? null : prompt('Informe a data/hora para acordar (formato ISO: YYYY-MM-DDTHH:mm:ss)');
    if (indefinite === null) return;
    if (!indefinite && !until) return;

    setActionLoading('hibernate');
    try {
      const { status: code, data } = await hibernateAgent(
        { publicId: agent.id, indefinite, until },
        session.jwt
      );
      if (code === 200) {
        setStatus({ type: 'success', message: 'Agente hibernado com sucesso.' });
        loadAgent();
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao hibernar agente.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume() {
    if (!confirm('Deseja acordar este agente?')) return;
    setActionLoading('resume');
    try {
      const { status: code, data } = await resumeAgent(agent.id, session.jwt);
      if (code === 200) {
        setStatus({ type: 'success', message: 'Agente acordado com sucesso.' });
        loadAgent();
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao acordar agente.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  function isHibernating() {
    if (!agent) return false;
    if (!agent.hibernating) return false;
    if (agent.hibernateUntil) {
      return new Date(agent.hibernateUntil) > new Date();
    }
    return true;
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );
  }

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

  const hibernating = isHibernating();

  return (
    <div className="space-y-6">
      <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={16} /> Meus agentes
      </Link>

      {status.message && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            status.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : 'border-green-500/40 bg-green-500/10 text-green-300'
          }`}
        >
          {status.type === 'error' ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <header className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20">
            <Bot size={32} className={hibernating ? 'text-slate-500' : 'text-brand-400'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-bold ${hibernating ? 'text-slate-500' : 'text-white'}`}>
                {agent.name}
              </h1>
              {hibernating ? (
                <Snowflake size={20} className="text-blue-400" title="Hibernando" />
              ) : (
                <CheckCircle2 size={20} className="text-green-400" title="Ativo" />
              )}
            </div>
            <p className="font-mono text-sm text-slate-400">@{agent.id}</p>
            {agent.auid && (
              <p className="font-mono text-xs text-slate-600">AUID: {agent.auid}</p>
            )}
            {agent.hibernateUntil && (
              <p className="text-xs text-slate-500">
                Acorda em: {new Date(agent.hibernateUntil).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={handleRegenerateKey}
            className="btn-secondary"
            disabled={!!actionLoading}
            title="Regenerar chave de API"
          >
            {actionLoading === 'regenerate' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
          {hibernating ? (
            <button
              onClick={handleResume}
              className="btn-secondary"
              disabled={!!actionLoading}
              title="Acordar agente"
            >
              {actionLoading === 'resume' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
            </button>
          ) : (
            <button
              onClick={handleHibernate}
              className="btn-secondary"
              disabled={!!actionLoading}
              title="Hibernar agente"
            >
              {actionLoading === 'hibernate' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Snowflake size={16} />
              )}
            </button>
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

      {showApiKeyModal && (
        <ApiKeyModal
          apiKey={regeneratedApiKey}
          onClose={() => setShowApiKeyModal(false)}
        />
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
