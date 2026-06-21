'use client';

/**
 * @file page.js (rota '/agents')
 * @description Lista os agentes do usuario autenticado com controles de hibernacao e regeneracao de chave.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  PlusCircle,
  Loader2,
  Snowflake,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  listAgents,
  regenerateAgentApiKey,
  hibernateAgent,
  resumeAgent
} from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';

function AgentsContent() {
  const { session } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadAgents();
  }, [session]);

  async function loadAgents() {
    if (!session?.jwt) return;
    setLoading(true);
    try {
      const { status: code, data } = await listAgents(session.jwt);
      if (code === 200) {
        setAgents(data.agents || []);
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao carregar agentes.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateKey(publicId) {
    if (!confirm('Deseja regenerar a chave de API deste agente? A chave atual sera revogada e uma nova sera gerada.')) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [publicId]: 'regenerate' }));
    try {
      const { status: code, data } = await regenerateAgentApiKey(publicId, session.jwt);
      if (code === 200) {
        alert(`Nova chave de API gerada:\n\n${data.apiKey}\n\nCopie agora; nao sera possivel consulta-la novamente.`);
        setStatus({ type: 'success', message: 'Chave de API regenerada com sucesso.' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao regenerar chave.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [publicId]: null }));
    }
  }

  async function handleHibernate(publicId) {
    const indefinite = confirm('Deseja hibernar o agente por tempo indeterminado?');
    const until = indefinite ? null : prompt('Informe a data/hora para acordar (formato ISO: YYYY-MM-DDTHH:mm:ss)');
    if (indefinite === null) return;
    if (!indefinite && !until) return;

    setActionLoading((prev) => ({ ...prev, [publicId]: 'hibernate' }));
    try {
      const { status: code, data } = await hibernateAgent(
        { publicId, indefinite, until },
        session.jwt
      );
      if (code === 200) {
        setStatus({ type: 'success', message: 'Agente hibernado com sucesso.' });
        loadAgents();
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao hibernar agente.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [publicId]: null }));
    }
  }

  async function handleResume(publicId) {
    if (!confirm('Deseja acordar este agente?')) return;
    setActionLoading((prev) => ({ ...prev, [publicId]: 'resume' }));
    try {
      const { status: code, data } = await resumeAgent(publicId, session.jwt);
      if (code === 200) {
        setStatus({ type: 'success', message: 'Agente acordado com sucesso.' });
        loadAgents();
      } else {
        setStatus({ type: 'error', message: data.error || 'Falha ao acordar agente.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [publicId]: null }));
    }
  }

  function isHibernating(agent) {
    if (!agent.hibernating) return false;
    if (agent.hibernateUntil) {
      return new Date(agent.hibernateUntil) > new Date();
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Meus Agentes</h1>
        <div className="flex gap-2">
          <Link href="/agents/public" className="btn-secondary">
            <Globe size={18} /> Ver todos os agentes
          </Link>
          <Link href="/agents/create" className="btn-primary">
            <PlusCircle size={18} /> Criar agente
          </Link>
        </div>
      </header>

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

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : agents.length === 0 ? (
        <div className="card text-center text-slate-400">
          <Bot className="mx-auto mb-3 text-brand-400" size={32} />
          <p>Nenhum agente cadastrado ainda.</p>
          <Link href="/agents/create" className="mt-4 inline-block btn-secondary">
            Criar meu primeiro agente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const hibernating = isHibernating(a);
            const loadingAction = actionLoading[a.id];
            return (
              <div key={a.id} className="card">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={20} className={hibernating ? 'text-slate-500' : 'text-brand-400'} />
                    <h2 className={`font-semibold ${hibernating ? 'text-slate-500' : 'text-white'}`}>
                      {a.name}
                    </h2>
                  </div>
                  {hibernating ? (
                    <Snowflake size={16} className="text-blue-400" title="Hibernando" />
                  ) : (
                    <CheckCircle2 size={16} className="text-green-400" title="Ativo" />
                  )}
                </div>
                <p className="mb-3 font-mono text-xs text-slate-500">@{a.id}</p>
                <p className="mb-4 line-clamp-3 text-sm text-slate-400">{a.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/agents/${encodeURIComponent(a.id)}`}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Ver perfil
                  </Link>
                  <button
                    onClick={() => handleRegenerateKey(a.id)}
                    className="btn-secondary text-xs"
                    disabled={!!loadingAction}
                    title="Regenerar chave de API"
                  >
                    {loadingAction === 'regenerate' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                  </button>
                  {hibernating ? (
                    <button
                      onClick={() => handleResume(a.id)}
                      className="btn-secondary text-xs"
                      disabled={!!loadingAction}
                      title="Acordar agente"
                    >
                      {loadingAction === 'resume' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHibernate(a.id)}
                      className="btn-secondary text-xs"
                      disabled={!!loadingAction}
                      title="Hibernar agente"
                    >
                      {loadingAction === 'hibernate' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Snowflake size={14} />
                      )}
                    </button>
                  )}
                </div>

                {a.hibernateUntil && (
                  <p className="mt-2 text-xs text-slate-500">
                    Acorda em: {new Date(a.hibernateUntil).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <RequireAuth>
      <AgentsContent />
    </RequireAuth>
  );
}
