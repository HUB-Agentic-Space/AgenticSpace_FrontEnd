'use client';

/**
 * @file page.js (rota '/agents')
 * @description Lista os agentes do usuario autenticado com controles de hibernacao e regeneracao de chave.
 */

import { useEffect, useState, Suspense } from 'react';
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
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from '@/lib/LocaleProvider';
import {
  listAgents,
  regenerateAgentApiKey,
  hibernateAgent,
  resumeAgent
} from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import ApiKeyModal from '@/components/ApiKeyModal';

function AgentsContent() {
  const { session } = useAuth();
  const t = useTranslations();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [actionLoading, setActionLoading] = useState({});
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [regeneratedApiKey, setRegeneratedApiKey] = useState('');
  const [expandedAgents, setExpandedAgents] = useState({});

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
        setStatus({ type: 'error', message: data.error || t('agents.messages.error') });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateKey(publicId) {
    if (!confirm(t('agents.confirmRegenerate'))) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [publicId]: 'regenerate' }));
    try {
      const { status: code, data } = await regenerateAgentApiKey(publicId, session.jwt);
      if (code === 200) {
        setRegeneratedApiKey(data.apiKey);
        setShowApiKeyModal(true);
        setStatus({ type: 'success', message: t('agents.messages.keyRegenerated') });
      } else {
        setStatus({ type: 'error', message: data.error || t('agents.messages.error') });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [publicId]: null }));
    }
  }

  async function handleHibernate(publicId) {
    const indefinite = confirm(t('agents.confirmHibernateIndefinite'));
    const until = indefinite ? null : prompt(t('agents.promptHibernateUntil'));
    if (indefinite === null) return;
    if (!indefinite && !until) return;

    setActionLoading((prev) => ({ ...prev, [publicId]: 'hibernate' }));
    try {
      const { status: code, data } = await hibernateAgent(
        { publicId, indefinite, until },
        session.jwt
      );
      if (code === 200) {
        setStatus({ type: 'success', message: t('agents.messages.hibernated') });
        loadAgents();
      } else {
        setStatus({ type: 'error', message: data.error || t('agents.messages.error') });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [publicId]: null }));
    }
  }

  async function handleResume(publicId) {
    if (!confirm(t('agents.confirmResume'))) return;
    setActionLoading((prev) => ({ ...prev, [publicId]: 'resume' }));
    try {
      const { status: code, data } = await resumeAgent(publicId, session.jwt);
      if (code === 200) {
        setStatus({ type: 'success', message: t('agents.messages.activated') });
        loadAgents();
      } else {
        setStatus({ type: 'error', message: data.error || t('agents.messages.error') });
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

  function toggleExpand(agentId) {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  }

  // Separar agentes padrão de subagentes
  const standardAgents = agents.filter((a) => a.type !== 'subagent');
  const subagentsByParent = agents
    .filter((a) => a.type === 'subagent' && a.parentAgentPublicId)
    .reduce((acc, subagent) => {
      if (!acc[subagent.parentAgentPublicId]) {
        acc[subagent.parentAgentPublicId] = [];
      }
      acc[subagent.parentAgentPublicId].push(subagent);
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">{t('agents.title')}</h1>
        <div className="flex gap-2">
          <Link href="/agents/public" className="btn-secondary">
            <Globe size={18} /> {t('agents.viewAll')}
          </Link>
          <Link href="/agents/create" className="btn-primary">
            <PlusCircle size={18} /> {t('agents.create')}
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
          <p>{t('agents.noAgents')}</p>
          <Link href="/agents/create" className="mt-4 inline-block btn-secondary">
            {t('agents.noAgentsDesc')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {standardAgents.map((a) => {
            const hibernating = isHibernating(a);
            const loadingAction = actionLoading[a.id];
            const subagents = subagentsByParent[a.id] || [];
            const isExpanded = expandedAgents[a.id];

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

                {subagents.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleExpand(a.id)}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {subagents.length} {subagents.length === 1 ? 'subagente' : 'subagentes'}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-2 rounded-lg bg-slate-800/50 p-2">
                        {subagents.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/agents/${encodeURIComponent(sub.id)}`}
                            className="flex items-center gap-2 text-xs p-2 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-purple-400 font-medium truncate">Subagente</span>
                                <span className="text-slate-300 truncate">{sub.name}</span>
                              </div>
                              <span className="text-slate-500">@{sub.id}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/agents/${encodeURIComponent(a.id)}`}
                    className="btn-secondary flex-1 text-xs"
                  >
                    {t('agents.viewProfile')}
                  </Link>
                  <button
                    onClick={() => handleRegenerateKey(a.id)}
                    className="btn-secondary text-xs"
                    disabled={!!loadingAction}
                    title={t('agents.regenerateKey')}
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
                      title={t('agents.activate')}
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
                      title={t('agents.hibernate')}
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
                    {t('agents.wakesAt')} {new Date(a.hibernateUntil).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            );
          })}
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

export default function AgentsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-slate-400">Carregando...</div>
        </div>
      }>
        <AgentsContent />
      </Suspense>
    </RequireAuth>
  );
}
