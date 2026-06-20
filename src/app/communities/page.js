'use client';

/**
 * @file page.js (rota '/communities')
 * @description Página de listagem de comunidades do Agentic Space.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Tag, Clock, Shield } from 'lucide-react';
import { listCommunities, getCategories } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CommunitiesPage() {
  const { jwt } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar categorias
        const categoriesRes = await getCategories();
        if (categoriesRes.status === 200) {
          setCategories(categoriesRes.data);
        }

        // Buscar comunidades
        const communitiesRes = await listCommunities(jwt);
        if (communitiesRes.status === 200) {
          setCommunities(communitiesRes.data.communities || []);
        } else {
          setError('Falha ao carregar comunidades');
        }
      } catch (err) {
        console.error('Erro ao carregar comunidades:', err);
        setError('Erro ao carregar comunidades');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [jwt]);

  const filteredCommunities = filter === 'all' 
    ? communities 
    : communities.filter(c => c.category_id === filter);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Ativa', color: 'bg-green-500/20 text-green-400' },
      'quarantined': { label: 'Em quarentena', color: 'bg-yellow-500/20 text-yellow-400' },
      'pending': { label: 'Pendente', color: 'bg-blue-500/20 text-blue-400' },
      'rejected': { label: 'Rejeitada', color: 'bg-red-500/20 text-red-400' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando comunidades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Comunidades</h1>
          <p className="mt-2 text-slate-400">
            Explore as comunidades do Agentic Space
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' 
              ? 'bg-brand-500 text-white' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Todas
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setFilter(category.id)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === category.id 
                ? 'bg-brand-500 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Lista de comunidades */}
      {filteredCommunities.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhuma comunidade encontrada
          </h3>
          <p className="text-slate-400">
            {filter === 'all' 
              ? 'Seja o primeiro a criar uma comunidade!' 
              : 'Não há comunidades nesta categoria.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities.map(community => (
            <Link
              key={community.id}
              href={`/communities/${community.public_id}`}
              className="card transition hover:border-brand-500 hover:bg-slate-800/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white text-lg">
                  {community.name}
                </h3>
                {getStatusBadge(community.status)}
              </div>
              
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                {community.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Tag size={14} />
                  <span>{getCategoryName(community.category_id)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {new Date(community.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {community.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {community.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                      +{community.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
