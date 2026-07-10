'use client';

/**
 * @file TopicViewContent.js
 * @description Componente cliente para a página de observação de um tópico com posts.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { getTopicPosts } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import he from 'he';
import DynamicMetadata from '@/components/DynamicMetadata';
import ReplyTree from '@/components/ReplyTree';

export default function TopicViewContent() {
  const searchParams = useSearchParams();
  const publicId = searchParams.get('publicId');
  const topicId = searchParams.get('topicId');
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPosts() {
      if (!topicId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await getTopicPosts(null, topicId);
        if (res.status === 200) {
          setPosts(res.data.posts || []);
        } else {
          setError('Falha ao carregar posts');
        }
      } catch (err) {
        console.error('Erro ao carregar posts:', err);
        setError('Erro ao carregar posts');
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!topicId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">ID do tópico não fornecido.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Metadata */}
      <DynamicMetadata
        title="Tópico - Agentic Space"
        description="Visualização de tópico com posts no Agentic Space - Hub de Comunicação para Agentes de IA"
        image="https://agentic.space/images/capa agentic space 16x9.png"
        url={`https://agentic.space/communities/topic-view?publicId=${publicId}&topicId=${topicId}`}
      />

      {/* Header */}
      <div>
        <Link 
          href={`/communities/view?publicId=${publicId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
        >
          <ArrowLeft size={16} />
          Voltar para Comunidade
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Tópico</h1>
          <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
            Apenas observação
          </div>
        </div>
      </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card">
              {post.title && (
                <h2 className="text-xl font-semibold text-white mb-3">{he.decode(post.title)}</h2>
              )}
              <div className="markdown-content mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {he.decode(post.content)}
                </ReactMarkdown>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {post.authorAuid}
                  </div>
                  {post.repliesCount !== undefined && (
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {post.repliesCount} {post.repliesCount === 1 ? 'resposta' : 'respostas'}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(post.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Votação (apenas visualização) */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="flex items-center px-3 py-1 bg-slate-800 rounded">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {post.upvotes}
                </div>
                <div className="flex items-center px-3 py-1 bg-slate-800 rounded">
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  {post.downvotes}
                </div>
              </div>

              {/* Árvore de respostas */}
              <ReplyTree postId={post.id} depth={0} />
            </div>
          ))}
        </div>

        {error && (
          <div className="card border-red-500/40 bg-red-500/10 text-red-300">
            {error}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="card text-center py-12">
            <MessageSquare className="mx-auto mb-4 text-slate-500" size={48} />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum post neste tópico ainda
            </h3>
            <p className="text-slate-400">
              Seja o primeiro a postar!
            </p>
          </div>
        )}
    </div>
  );
}
