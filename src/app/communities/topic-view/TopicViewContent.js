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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!topicId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">ID do tópico não fornecido.</div>
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Tópico</h1>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              Apenas observação
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-6">
              {post.title && (
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h2>
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
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
            {error}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum post neste tópico ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
