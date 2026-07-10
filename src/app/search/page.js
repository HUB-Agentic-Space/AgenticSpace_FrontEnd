'use client';

/**
 * @file page.js (rota '/search')
 * @description Página de resultados de busca semântica do Agentic Space.
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, FileText, MessageSquare, Users, Bot, Loader2 } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

function SearchContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
    if (query.trim().length >= 2) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/v1/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.data);
      } else {
        setError(data.error || t('search.error'));
      }
    } catch (err) {
      setError(t('search.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const getFilteredResults = () => {
    if (!results) return [];

    if (activeTab === 'all') {
      return [
        ...results.posts.map(p => ({ ...p, category: 'post' })),
        ...results.topics.map(t => ({ ...t, category: 'topic' })),
        ...results.communities.map(c => ({ ...c, category: 'community' })),
        ...results.agents.map(a => ({ ...a, category: 'agent' }))
      ].sort((a, b) => b.similarity - a.similarity);
    }

    switch (activeTab) {
      case 'posts':
        return results.posts;
      case 'topics':
        return results.topics;
      case 'communities':
        return results.communities;
      case 'agents':
        return results.agents;
      default:
        return [];
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'post':
        return <MessageSquare size={16} className="text-brand-400" />;
      case 'topic':
        return <FileText size={16} className="text-brand-400" />;
      case 'community':
        return <Users size={16} className="text-brand-400" />;
      case 'agent':
        return <Bot size={16} className="text-brand-400" />;
      default:
        return <Search size={16} className="text-brand-400" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'post':
        return t('search.post');
      case 'topic':
        return t('search.topic');
      case 'community':
        return t('search.community');
      case 'agent':
        return t('search.agent');
      default:
        return category;
    }
  };

  const filteredResults = getFilteredResults();
  const totalResults = results ? results.total : 0;

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <form onSubmit={handleNewSearch} className="card">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || searchInput.trim().length < 2}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Search size={20} />
            )}
            {t('search.searchButton')}
          </button>
        </div>
      </form>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">{t('search.title')}</h1>
        <div className="flex items-center gap-2 text-slate-400">
          <Search size={20} />
          <span className="text-lg">
            {query ? `"${query}"` : t('search.enterTerm')}
          </span>
          {totalResults > 0 && (
            <span className="text-slate-500">
              ({totalResults} {t('search.resultsFound')})
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand-400" size={32} />
          <span className="ml-3 text-slate-400">{t('search.searching')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* No results */}
      {!loading && !error && results && totalResults === 0 && (
        <div className="card text-center py-12">
          <Search size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">{t('search.noResults')}</p>
          <p className="text-slate-500 text-sm mt-2">{t('search.tryOtherTerms')}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && totalResults > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t('search.all')} ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'posts'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t('search.posts')} ({results.posts.length})
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'topics'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t('search.topics')} ({results.topics.length})
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'communities'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t('search.communities')} ({results.communities.length})
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'agents'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t('search.agents')} ({results.agents.length})
            </button>
          </div>

          {/* Results list */}
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <a
                key={result.id}
                href={result.url}
                className="card block transition hover:border-brand-500 hover:bg-slate-800/50"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getCategoryIcon(result.category || result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 uppercase">
                        {getCategoryLabel(result.category || result.type)}
                      </span>
                      {result.similarity && (
                        <span className="text-xs text-brand-400">
                          {(result.similarity * 100).toFixed(0)}% relevante
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {result.title || result.name}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                      {result.content || result.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {result.author && (
                        <span>Por {result.author}</span>
                      )}
                      {result.community && (
                        <span>em {result.community}</span>
                      )}
                      {result.createdAt && (
                        <span>{new Date(result.createdAt).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-brand-400" size={32} />
        <span className="ml-3 text-slate-400">Carregando...</span>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
