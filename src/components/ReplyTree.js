'use client';

/**
 * @file ReplyTree.js
 * @description Componente recursivo para exibir árvore de respostas com expansão lazy.
 */

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { getReplyTree } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import he from 'he';

export default function ReplyTree({ postId, depth = 0, parentDepth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyCount, setReplyCount] = useState(0);

  // Carregar respostas apenas quando expandido pela primeira vez
  useEffect(() => {
    if (expanded && replies.length === 0 && !loading) {
      loadReplies();
    }
  }, [expanded]);

  async function loadReplies() {
    try {
      setLoading(true);
      setError(null);
      const res = await getReplyTree(null, postId);
      if (res.status === 200) {
        const replyData = res.data.replies || [];
        setReplies(replyData);
        
        // Contar respostas diretas (parentId === postId)
        const directReplies = replyData.filter(r => r.parentId === postId).length;
        setReplyCount(directReplies);
      } else {
        setError('Falha ao carregar respostas');
      }
    } catch (err) {
      console.error('Erro ao carregar respostas:', err);
      setError('Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  }

  // Contar respostas filhas para uma resposta específica
  function countChildReplies(replyId, allReplies) {
    return allReplies.filter(r => r.parentId === replyId).length;
  }

  // Filtrar respostas diretas ao post atual
  function getDirectReplies() {
    return replies.filter(r => r.parentId === postId);
  }

  if (!expanded) {
    // Mostrar botão de expansão com contador
    return (
      <div 
        className="mt-3"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <button
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
        >
          <MessageSquare size={16} />
          <span>Ver {replyCount > 0 ? replyCount : 'respostas'}</span>
          {replyCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {replyCount}
            </span>
          )}
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${depth * 24}px` }} className="mt-3 space-y-3">
      {/* Botão para colapsar */}
      <button
        onClick={() => setExpanded(false)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all duration-200 text-sm"
      >
        <ChevronRight size={16} />
        <span>Ocultar respostas</span>
      </button>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <Spinner size={16} />
          <span>Carregando respostas...</span>
        </div>
      )}

      {error && (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300 text-sm py-2">
          {error}
        </div>
      )}

      {!loading && !error && replies.length === 0 && (
        <div className="text-slate-500 text-sm py-2 italic">
          Nenhuma resposta ainda
        </div>
      )}

      {!loading && !error && replies.length > 0 && (
        <div className="space-y-3">
          {getDirectReplies().map((reply) => {
            const childCount = countChildReplies(reply.post.id, replies);
            const post = reply.post;
            
            return (
              <div key={post.id} className="card bg-slate-800/50 border-slate-700/50">
                {post.title && (
                  <h3 className="text-lg font-semibold text-white mb-2">{he.decode(post.title)}</h3>
                )}
                <div className="markdown-content mb-3 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {he.decode(post.content)}
                  </ReactMarkdown>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {post.authorAuid}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(post.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>

                {/* Votação */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <div className="flex items-center px-2 py-1 bg-slate-700 rounded">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {post.upvotes}
                  </div>
                  <div className="flex items-center px-2 py-1 bg-slate-700 rounded">
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {post.downvotes}
                  </div>
                </div>

                {/* Recursão para respostas filhas */}
                {childCount > 0 && (
                  <ReplyTree 
                    postId={post.id} 
                    depth={depth + 1}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
