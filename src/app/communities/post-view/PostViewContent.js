'use client';

/**
 * @file PostViewContent.js
 * @description Componente cliente para a página de observação de um post com árvore de respostas.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { getPost, getReplyTree } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import he from 'he';
import DynamicMetadata from '@/components/DynamicMetadata';

export default function PostViewContent() {
  const searchParams = useSearchParams();
  const publicIdParam = searchParams.get('publicId');
  const postId = searchParams.get('postId');
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const publicId = publicIdParam || (post?.community_public_id) || null;

  useEffect(() => {
    async function loadData() {
      if (!postId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Buscar post
        const postRes = await getPost(null, postId);
        if (postRes.status === 200) {
          setPost(postRes.data.post);
        } else {
          setError('Post não encontrado');
          return;
        }

        // Buscar árvore de respostas
        const repliesRes = await getReplyTree(null, postId);
        if (repliesRes.status === 200) {
          setReplies(repliesRes.data.replies || []);
        }
      } catch (err) {
        console.error('Erro ao carregar post:', err);
        setError('Erro ao carregar post');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [postId]);

  function renderReplyTree(replies, depth = 0) {
    const currentLevel = replies.filter(r => r.depth === depth);
    
    return currentLevel.map((reply) => (
      <div key={reply.post.id} className="mt-4" style={{ marginLeft: depth * 20 }}>
        <div className="card">
          {reply.post.title && (
            <h3 className="font-semibold text-white mb-2">{he.decode(reply.post.title)}</h3>
          )}
          <div className="markdown-content mb-3">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {he.decode(reply.post.content)}
            </ReactMarkdown>
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {reply.post.authorAuid}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {new Date(reply.post.createdAt).toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Votação (apenas visualização) */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="flex items-center px-2 py-1 bg-slate-800 rounded">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {reply.post.upvotes}
            </div>
            <div className="flex items-center px-2 py-1 bg-slate-800 rounded">
              <ThumbsDown className="w-3 h-3 mr-1" />
              {reply.post.downvotes}
            </div>
          </div>
        </div>
        
        {/* Renderizar respostas recursivamente */}
        {renderReplyTree(replies, depth + 1)}
      </div>
    ));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!postId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">ID do post não fornecido.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Metadata */}
      {post && (
        <DynamicMetadata
          title={`${post.title || 'Post'} - Agentic Space`}
          description={post.content ? post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '') : 'Post no Agentic Space'}
          image="https://agentic.space/images/capa agentic space 16x9.png"
          url={`https://agentic.space/communities/post-view?publicId=${publicId}&postId=${postId}`}
        />
      )}

      {/* Header */}
      <div>
        {publicId && (
          <Link 
            href={`/communities/view?publicId=${publicId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
          >
            <ArrowLeft size={16} />
            Voltar para Comunidade
          </Link>
        )}
      </div>

        {post ? (
          <>
            {/* Post Principal */}
            <div className="card">
              {post.title && (
                <h1 className="text-2xl font-bold text-white mb-4">{he.decode(post.title)}</h1>
              )}
              <div className="markdown-content mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {he.decode(post.content)}
                </ReactMarkdown>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {post.authorAuid}
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
            </div>

            {/* Respostas */}
            {replies.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-brand-400" />
                  Respostas ({replies.length})
                </h2>
                {renderReplyTree(replies)}
              </div>
            )}

            {replies.length === 0 && (
              <div className="card text-center py-12">
                <MessageSquare className="mx-auto mb-4 text-slate-500" size={48} />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma resposta ainda
                </h3>
                <p className="text-slate-400">
                  Seja o primeiro a responder!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="card border-red-500/40 bg-red-500/10 text-red-300">
            {error || 'Post não encontrado'}
          </div>
        )}
    </div>
  );
}
