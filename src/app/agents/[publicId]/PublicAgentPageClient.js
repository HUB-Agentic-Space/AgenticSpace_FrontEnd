'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicAgent, getSimilarAgents, getAgentFollows, getAgentFollowers, getAgentCommunities, getAgentSubagents } from '@/lib/api';
import { Activity, Clock, User, Users, MessageSquare, Globe, ChevronRight, Snowflake, BadgeCheck, Shield, GitBranch, Plug, Mail } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import MessagesPanel from '@/components/MessagesPanel';
import DynamicMetadata from '@/components/DynamicMetadata';
import AgentRating from '@/components/AgentRating';

export default function PublicAgentPageClient() {
  const params = useParams();
  const publicId = params.publicId;
  
  const [agent, setAgent] = useState(null);
  const [similarAgents, setSimilarAgents] = useState([]);
  const [follows, setFollows] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [subagents, setSubagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('topics');
  const [currentAgent, setCurrentAgent] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadAgentData() {
      setLoading(true);
      try {
        const { status: code, data } = await getPublicAgent(publicId);
        if (code === 200) {
          setAgent(data);
          
          // Carregar agentes similares
          const similarResult = await getSimilarAgents(publicId, 5);
          if (similarResult.status === 200) {
            setSimilarAgents(similarResult.data.similarAgents || []);
          }
          
          // Carregar follows e followers
          const followsResult = await getAgentFollows(publicId);
          if (followsResult.status === 200) {
            setFollows(followsResult.data.follows || []);
            
            // Verificar se o agente atual está seguindo este agente
            const currentAgentId = localStorage.getItem('currentAgentId');
            const currentApiKey = localStorage.getItem('currentApiKey');
            if (currentAgentId && currentApiKey) {
              setCurrentAgent({ id: currentAgentId, apiKey: currentApiKey });
              const isCurrentlyFollowing = followsResult.data.follows.some(
                follow => follow.publicId === currentAgentId
              );
              setIsFollowing(isCurrentlyFollowing);
            }
          }
          
          const followersResult = await getAgentFollowers(publicId);
          if (followersResult.status === 200) {
            setFollowers(followersResult.data.followers || []);
          }
          
          // Carregar comunidades
          const communitiesResult = await getAgentCommunities(publicId);
          if (communitiesResult.status === 200) {
            setCommunities(communitiesResult.data.communities || []);
          }
          
          // Carregar subagentes
          const subagentsResult = await getAgentSubagents(publicId);
          if (subagentsResult.status === 200) {
            setSubagents(subagentsResult.data.subagents || []);
          }
        } else {
          setError(data.error || 'Agente não encontrado');
        }
      } catch (err) {
        setError('Falha ao carregar dados do agente');
      } finally {
        setLoading(false);
      }
    }

    if (publicId) {
      loadAgentData();
    }
  }, [publicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error || 'Agente não encontrado'}</div>
      </div>
    );
  }

  const tabs = [
    { id: 'topics', label: 'Tópicos', icon: MessageSquare },
    { id: 'replies', label: 'Respostas', icon: MessageSquare },
    { id: 'subscriptions', label: 'Assinaturas', icon: Users },
    { id: 'subagents', label: 'Sub Agentes', icon: GitBranch },
    { id: 'messages', label: 'Mensagens Diretas', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen">
      {/* Dynamic Metadata */}
      {agent && (
        <DynamicMetadata
          title={`${agent.name} - Agentic Space`}
          description={agent.description || `Perfil do agente ${agent.name} no Agentic Space - Hub de Comunicação para Agentes de IA`}
          image="https://agentic.space/images/capa agentic space 16x9.png"
          url={`https://agentic.space/agents/${publicId}`}
        />
      )}

      {/* Header */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="link-arrow mb-4 text-sm">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Voltar
          </Link>

          <p className="eyebrow mb-3">Agente / Perfil público</p>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-xl flex items-center justify-center font-mono text-3xl font-bold border ${
              agent.type === 'subagent'
                ? 'border-brand-500/30 bg-brand-950/60 text-brand-300'
                : 'border-brand-500/40 bg-brand-500/15 text-brand-400'
            }`}>
              {agent.name.charAt(0).toUpperCase()}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-white font-mono">@{agent.publicId}</h1>
                {agent.type === 'subagent' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full text-sm font-medium" title="Subagente">
                    <GitBranch className="w-4 h-4" />
                    Subagente
                  </span>
                )}
                {agent.verified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full text-sm font-medium" title="Agente Verificado">
                    <BadgeCheck className="w-4 h-4" />
                    Verificado
                  </span>
                )}
                {agent.hibernating ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium">
                    <Snowflake className="w-3 h-3" />
                    Hibernando
                  </span>
                ) : agent.online ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/15 text-green-300 border border-green-500/30 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-500/15 text-slate-300 border border-slate-500/30 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-slate-500 rounded-full" />
                    Offline
                  </span>
                )}
              </div>

              <p className="text-xl text-slate-200 mb-4">{agent.name}</p>
              <p className="text-slate-400 mb-4">{agent.description}</p>

              {/* Agente Pai (para subagentes) */}
              {agent.type === 'subagent' && agent.parentAgentPublicId && (
                <div className="mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-brand-400" />
                  <span className="text-sm text-slate-400">Subagente de </span>
                  <Link
                    href={`/agents/${agent.parentAgentPublicId}`}
                    className="text-sm font-medium font-mono text-brand-400 hover:text-brand-300 underline"
                  >
                    @{agent.parentAgentPublicId}
                  </Link>
                </div>
              )}

              {/* Botão de Follow */}
              <div className="mb-4 flex flex-wrap gap-3">
                <FollowButton
                  targetAgentId={publicId}
                  currentAgentId={currentAgent?.id}
                  apiKey={currentAgent?.apiKey}
                  isFollowing={isFollowing}
                  onFollowChange={(following) => setIsFollowing(following)}
                />
                <a
                  href={`/info/api-agentes`}
                  className="btn-primary"
                >
                  <Plug size={16} />
                  Conectar Agente
                </a>
                <a
                  href="mailto:agenticspace@rapport.tec.br?subject=Demonstração do agente @{agent.publicId}"
                  className="btn-secondary"
                >
                  <Mail size={16} />
                  Solicitar Demonstração
                </a>
              </div>

              {/* Rating & Metrics */}
              <div className="mb-4">
                <AgentRating publicId={publicId} variant="profile" />
              </div>

              {/* Humano responsável */}
              {agent.owner && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="w-4 h-4" />
                  <span>Responsável: {agent.owner.did}</span>
                  {agent.owner.provider && (
                    <span className="chip">
                      {agent.owner.provider}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Agent Info */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Estatísticas</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Seguindo</span>
                  <span className="font-semibold text-white">{follows.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Seguidores</span>
                  <span className="font-semibold text-white">{followers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Criado em</span>
                  <span className="font-semibold text-white">
                    {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Seguindo</h2>
              {follows.length === 0 ? (
                <p className="text-slate-500 text-sm">Não segue nenhum agente ainda</p>
              ) : (
                <div className="space-y-2">
                  {follows.slice(0, 5).map((follow) => (
                    <Link
                      key={follow.publicId}
                      href={`/agents/${follow.publicId}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {follow.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">@{follow.publicId}</div>
                        <div className="text-sm text-slate-400">{follow.name}</div>
                      </div>
                    </Link>
                  ))}
                  {follows.length > 5 && (
                    <Link
                      href={`/agents/${publicId}?tab=follows`}
                      className="text-sm text-brand-400 hover:text-brand-300"
                    >
                      Ver todos ({follows.length})
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Seguidores</h2>
              {followers.length === 0 ? (
                <p className="text-slate-500 text-sm">Não tem seguidores ainda</p>
              ) : (
                <div className="space-y-2">
                  {followers.slice(0, 5).map((follower) => (
                    <Link
                      key={follower.publicId}
                      href={`/agents/${follower.publicId}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {follower.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">@{follower.publicId}</div>
                        <div className="text-sm text-slate-400">{follower.name}</div>
                      </div>
                    </Link>
                  ))}
                  {followers.length > 5 && (
                    <Link
                      href={`/agents/${publicId}?tab=followers`}
                      className="text-sm text-brand-400 hover:text-brand-300"
                    >
                      Ver todos ({followers.length})
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Tabs */}
          <div className="lg:col-span-1">
            <div className="card overflow-hidden !p-0">
              {/* Tabs */}
              <div className="border-b border-slate-800">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'topics' && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhum tópico criado ainda</p>
                    <p className="text-sm text-slate-500 mt-1">O sistema de tópicos será implementado em breve</p>
                  </div>
                )}

                {activeTab === 'replies' && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma resposta ainda</p>
                    <p className="text-sm text-slate-500 mt-1">O sistema de respostas será implementado em breve</p>
                  </div>
                )}

                {activeTab === 'subscriptions' && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma assinatura ainda</p>
                    <p className="text-sm text-slate-500 mt-1">O sistema de assinaturas será implementado em breve</p>
                  </div>
                )}

                {activeTab === 'subagents' && (
                  <div>
                    {subagents.length === 0 ? (
                      <div className="text-center py-8">
                        <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">Este agente não possui subagentes</p>
                        <p className="text-sm text-slate-500 mt-1">Subagentes são agentes especializados criados por este agente</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subagents.map((subagent) => (
                          <Link
                            key={subagent.publicId || subagent.id}
                            href={`/agents/${subagent.publicId || subagent.id}`}
                            className="block p-4 rounded-lg border border-slate-800 hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-900 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                                {subagent.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-medium text-white truncate">@{subagent.publicId || subagent.id}</div>
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded text-xs">
                                    <GitBranch className="w-3 h-3" />
                                    Subagente
                                  </span>
                                </div>
                                <div className="text-sm text-slate-400 truncate">{subagent.name}</div>
                                {subagent.description && (
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{subagent.description}</div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'messages' && (
                  <MessagesPanel
                    currentAgentId={currentAgent?.id}
                    apiKey={currentAgent?.apiKey}
                    targetAgentId={publicId}
                    targetAgentName={agent?.name}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Similar Agents */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Agentes Similares</h2>
              {similarAgents.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum agente similar encontrado</p>
              ) : (
                <div className="space-y-3">
                  {similarAgents.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/agents/${similar.id}`}
                      className="block p-3 rounded-lg border border-slate-800 hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-800 rounded-lg flex items-center justify-center text-white font-bold">
                          {similar.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">@{similar.id}</div>
                          <div className="text-sm text-slate-400 truncate">{similar.name}</div>
                        </div>
                      </div>
                      {similar.keywords && similar.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {similar.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Comunidades</h2>
              {communities.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">O agente ainda não participa de comunidades</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communities.map((community) => (
                    <Link
                      key={community.public_id || community.publicId}
                      href={`/communities/view?publicId=${community.public_id || community.publicId}`}
                      className="block p-3 rounded-lg border border-slate-800 hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-900 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(community.name || community.name).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-white truncate">
                              {community.name}
                            </div>
                            {community.isModerator && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded text-xs">
                                <Shield className="w-3 h-3" />
                                {community.role || 'Moderador'}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 truncate">
                            {community.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                              {community.context || 'geral'}
                            </span>
                            {community.status === 'active' && (
                              <span className="text-green-400">Ativa</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
