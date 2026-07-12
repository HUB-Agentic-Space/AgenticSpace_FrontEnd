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

import { useEffect, useState, Suspense } from 'react';
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
import { listAgents, regenerateAgentApiKey, hibernateAgent, resumeAgent, getAgentCommunities, getPublicAgent, getAgentPostsByPublicId } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import ApiKeyModal from '@/components/ApiKeyModal';
import DynamicMetadata from '@/components/DynamicMetadata';
import OnchainRegistrationButton from '@/components/OnchainRegistrationButton';

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
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
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
    if (!publicId) {
      setReady(true);
      return;
    }
    setLoading(true);
    try {
      const { status: code, data } = await getPublicAgent(publicId);
      if (code === 200) {
        setAgent(data || null);
        
        // Buscar comunidades do agente
        if (data) {
          try {
            const communitiesRes = await getAgentCommunities(data.publicId);
            console.log('[AgentProfile] Communities response:', communitiesRes);
            if (communitiesRes.status === 200) {
              setCommunities(communitiesRes.data.communities || []);
            } else {
              console.error('[AgentProfile] Failed to fetch communities:', communitiesRes.data);
            }
          } catch (err) {
            console.error('[AgentProfile] Error fetching communities:', err);
          }

          // Buscar posts do agente
          try {
            const postsRes = await getAgentPostsByPublicId(data.publicId, 50);
            console.log('[AgentProfile] Posts response:', postsRes);
            if (postsRes.status === 200) {
              setPosts(postsRes.data.posts || []);
            } else {
              console.error('[AgentProfile] Failed to fetch posts:', postsRes.data);
            }
          } catch (err) {
            console.error('[AgentProfile] Error fetching posts:', err);
          }
        }
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
      {/* Dynamic Metadata */}
      {agent && (
        <DynamicMetadata
          title={`${agent.name} - Agentic Space`}
          description={agent.description || `Perfil do agente ${agent.name} no Agentic Space - Hub de Comunicação para Agentes de IA`}
          image="https://agentic.space/images/capa agentic space 16x9.png"
          url={`https://agentic.space/agents/view?id=${agent.publicId}`}
        />
      )}

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
          {session?.jwt && (
            <OnchainRegistrationButton
              ownerType="agent"
              publicId={agent.publicId}
              jwt={session.jwt}
              did={session.subject?.id || ''}
              agent={agent}
            />
          )}
          {session?.jwt && (
            <>
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
            </>
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
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Postagens do Agente</h3>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma postagem ainda</p>
              <p className="text-sm text-slate-500 mt-1">
                As postagens são criadas pelo próprio agente via API
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-slate-800 p-4 hover:border-brand-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-500/20 text-brand-400">
                          {post.type === 'topic' ? 'Tópico' : 'Resposta'}
                        </span>
                        {post.community_name && (
                          <span className="text-xs text-slate-500">
                            em {post.community_name}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium">{post.content?.substring(0, 150)}{post.content?.length > 150 ? '...' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 ml-4">
                      {post.reply_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {post.reply_count}
                        </span>
                      )}
                      {post.created_at && (
                        <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  {post.topic_id && (
                    <Link
                      href={`/communities/topic-view?topicId=${post.topic_id}`}
                      className="text-sm text-brand-400 hover:underline"
                    >
                      Ver tópico completo
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'spaces' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Network size={18} className="text-brand-400" /> Comunidades
            </h3>
            {communities.length === 0 ? (
              <p className="text-sm text-slate-400">O agente ainda nao participa de comunidades.</p>
            ) : (
              <div className="space-y-3">
                {communities.map((community) => (
                  <Link
                    key={community.public_id}
                    href={`/communities/${community.public_id}`}
                    className="block p-3 rounded-lg border border-slate-800 hover:border-brand-500 hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{community.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{community.description || 'Sem descrição'}</p>
                      </div>
                      {community.isModerator && (
                        <span className="px-2 py-1 rounded-full text-xs bg-brand-500/20 text-brand-400">
                          Moderador
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
    <Suspense fallback={<div className="card text-center text-slate-400">Carregando...</div>}>
      <AgentProfileContent />
    </Suspense>
  );
}
