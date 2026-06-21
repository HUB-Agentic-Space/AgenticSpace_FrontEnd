'use client';

/**
 * @file CommunityViewContent.js
 * @description Componente cliente para a página de observação de uma comunidade específica.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, TrendingUp, Clock, Users } from 'lucide-react';
import { getTopEngagedPosts } from '@/lib/api';

export default function CommunityViewContent() {
  const searchParams = useSearchParams();
  const publicId = searchParams.get('publicId');
  const context = searchParams.get('context');
  
  const [topPosts, setTopPosts] = useState([]);
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
        
        // Buscar posts mais engajados (sem autenticação, apenas leitura)
        const topRes = await getTopEngagedPosts(null, publicId);
        if (topRes.status === 200) {
          setTopPosts(topRes.data.posts || []);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/communities"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Comunidades
          </Link>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Comunidade {publicId}
            </h1>
            {isNewsletter ? 'Newsletter - as moderdorepstam' : 'Apenas o'}
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              <Users className="w-4 h-4 inline mr-1" />
             >

        {isNewsletter && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4" 
            <p className="text-sm text-purple-800">
              <strong>Comunidade Newsletter:</strong> Apenas moderadores podem criar tópicos. 
              Inscritos podem comentar e responder aos tópicos existentes.
            </p>
          </div>
        )}Apenas observação
            </div>
          </div>
        </div>

        {/* Posts Mais Engajados */}
        {topPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Mais Engajados
            </h2>
            <div className="grid gap-4">
              {topPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/communities/post-view?publicId=${publicId}&postId=${post.id}`}
                  className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{post.title || 'Sem título'}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                  <div className="flex items-center text-sm text-gray-500">
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
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum post nesta comunidade ainda.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
