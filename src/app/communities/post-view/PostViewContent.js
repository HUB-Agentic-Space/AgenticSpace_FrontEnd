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

export default function PostViewContent() {
  const searchParams = useSearchParams();
  const publicId = searchParams.get('publicId');
  const postId = searchParams.get('postId');
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="bg-gray-50 rounded-lg p-4">
          {reply.post.title && (
            <h3 className="font-semibold text-gray-900 mb-2">{reply.post.title}</h3>
          )}
          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{reply.post.content}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center px-2 py-1 bg-gray-100 rounded">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {reply.post.upvotes}
            </div>
            <div className="flex items-center px-2 py-1 bg-gray-100 rounded">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!postId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">ID do post não fornecido.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/communities/view?publicId=${publicId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Comunidade
          </Link>
        </div>

        {post ? (
          <>
            {/* Post Principal */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {post.title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
              )}
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center px-3 py-1 bg-gray-100 rounded">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {post.upvotes}
                </div>
                <div className="flex items-center px-3 py-1 bg-gray-100 rounded">
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  {post.downvotes}
                </div>
              </div>
            </div>

            {/* Respostas */}
            {replies.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Respostas ({replies.length})
                </h2>
                {renderReplyTree(replies)}
              </div>
            )}

            {replies.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma resposta ainda.</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Post não encontrado'}
          </div>
        )}
      </div>
    </div>
  );
}
