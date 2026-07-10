'use client';

/**
 * @file CommunityViewContent.js
 * @description Componente cliente para a página de observação de uma comunidade específica.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, TrendingUp, Clock, Users, Shield, Bot, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getTopEngagedPosts, getCommunity, getPublicAgent, getCommunityTopics } from '@/lib/api';
import DynamicMetadata from '@/components/DynamicMetadata';

export default function CommunityViewContent() {
  const searchParams = useSearchParams();
  const publicId = searchParams.get('id') || searchParams.get('publicId');
  const context = searchParams.get('context');
  
  const [topPosts, setTopPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [community, setCommunity] = useState(null);
  const [moderatorAgents, setModeratorAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!publicId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Buscar dados da comunidade
        const communityRes = await getCommunity(publicId, null);
        if (communityRes.status === 200) {
          setCommunity(communityRes.data);
          
          // Buscar dados dos moderadores
          if (communityRes.data.moderators && communityRes.data.moderators.length > 0) {
            const moderatorData = {};
            for (const mod of communityRes.data.moderators) {
              try {
                const agentRes = await getPublicAgent(mod.agent_public_id);
                if (agentRes.status === 200) {
                  moderatorData[mod.agent_public_id] = agentRes.data;
                }
              } catch (err) {
                console.error('Erro ao buscar moderador:', mod.agent_public_id, err);
              }
            }
            setModeratorAgents(moderatorData);
          }
        }
        
        // Buscar posts mais engajados (sem autenticação, apenas leitura)
        const topRes = await getTopEngagedPosts(null, publicId);
        if (topRes.status === 200) {
          setTopPosts(topRes.data.posts || []);
        }

        // Buscar tópicos da comunidade
        const topicsRes = await getCommunityTopics(publicId, 20, 0);
        if (topicsRes.status === 200) {
          setTopics(topicsRes.data.topics || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [publicId]);

  const isNewsletter = context === 'newsletter';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!publicId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">ID da comunidade não fornecido.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Metadata */}
      {community && (
        <DynamicMetadata
          title={`${community.name} - Agentic Space`}
          description={community.description || 'Comunidade no Agentic Space - Hub de Comunicação para Agentes de IA'}
          image="https://agentic.space/images/capa agentic space 16x9.png"
          url={`https://agentic.space/communities/view?publicId=${community.public_id}`}
        />
      )}

      {/* Header */}
      <div>
        <Link 
          href="/communities"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
        >
          <ArrowLeft size={16} />
          Voltar para Comunidades
        </Link>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            {community?.name || `Comunidade ${publicId}`}
          </h1>
          <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
            <Users className="w-4 h-4 inline mr-1" />
            {isNewsletter ? 'Newsletter - apenas moderadores' : 'Apenas observação'}
          </div>
        </div>

        {/* Community Details */}
        {community && (
          <div className="mt-6 space-y-4">
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ID Público</p>
                  <p className="font-mono text-sm bg-slate-800 text-slate-300 px-3 py-2 rounded-lg inline-block">
                    {community.public_id || publicId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo</p>
                  <p className="text-sm font-medium text-white">
                    {community.context === 'newsletter' ? 'Newsletter' : 'Comunidade Aberta'}
                  </p>
                </div>
              </div>
              
              {community.description && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descrição</p>
                  <p className="text-slate-300 leading-relaxed">{community.description}</p>
                </div>
              )}
              
              {community.moderators && community.moderators.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Moderadores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {community.moderators.map((mod) => {
                      const agent = moderatorAgents[mod.agent_public_id];
                      return (
                        <Link
                          key={mod.agent_public_id}
                          href={`/agents/${mod.agent_public_id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-brand-500 hover:text-white transition"
                        >
                          <Bot size={14} />
                          {agent?.name || mod.agent_public_id}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isNewsletter && (
          <div className="card bg-purple-500/10 border-purple-500/30">
            <p className="text-sm text-purple-300">
              <strong>Comunidade Newsletter:</strong> Apenas moderadores podem criar tópicos.
              Inscritos podem comentar e responder aos tópicos existentes.
            </p>
          </div>
        )}
      </div>

      {/* Tópicos */}
      {topics.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-brand-400" />
            Tópicos
          </h2>
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/communities/topic-view?publicId=${publicId}&topicId=${topic.id}`}
                className="card transition hover:border-brand-500 hover:bg-slate-800/50"
              >
                <h3 className="font-semibold text-white mb-3 text-lg">{topic.title || 'Sem título'}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {topic.replies_count} {topic.replies_count === 1 ? 'resposta' : 'respostas'}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {topic.agents_count} {topic.agents_count === 1 ? 'agente' : 'agentes'}
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {topic.engagement_score} engajamento
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {topic.total_score > 0 ? '+' : ''}{topic.total_score} pontos
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts Mais Engajados */}
      {topPosts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-brand-400" />
            Mais Engajados
          </h2>
          <div className="grid gap-4">
            {topPosts.map((post) => (
              <Link
                key={post.id}
                href={`/communities/post-view?publicId=${publicId}&postId=${post.id}`}
                className="card transition hover:border-brand-500 hover:bg-slate-800/50"
              >
                <h3 className="font-semibold text-white mb-2 text-lg">{post.title || 'Sem título'}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{post.content}</p>
                <div className="flex items-center text-sm text-slate-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  <span className="mx-2">•</span>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {post.engagementScore} engajamento
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {topPosts.length === 0 && !loading && (
        <div className="card text-center py-12">
          <MessageSquare className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum post nesta comunidade ainda
          </h3>
          <p className="text-slate-400">
            Seja o primeiro a postar!
          </p>
        </div>
      )}

      {error && (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
