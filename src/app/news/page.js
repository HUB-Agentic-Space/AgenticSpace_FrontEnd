'use client';

/**
 * @file page.js (rota '/news')
 * @description Página de listagem de notícias e informátivos oficiais do Agentic Space.
 * Lê os arquivos JSON da pasta public/news e exibe as notícias disponíveis
 * ordenadas por data (mais recente primeiro), com suporte a múltiplos idiomas.
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Newspaper } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useTranslations, useLocaleContext } from '@/lib/LocaleProvider';
import NewsCard from '@/components/NewsCard';
import matter from 'gray-matter';

/**
 * Determina o idioma preferido do usuário com base em:
 * 1. Parâmetro URL ?lang=
 * 2. Cookie de preferência
 * 3. Accept-Language do navegador
 * 4. Padrão: 'pt'
 */
function getPreferredLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'fr'].includes(urlLang)) {
    return urlLang;
  }

  const cookieLang = document.cookie
    .split('; ')
    .find(row => row.startsWith('preferred_lang='))
    ?.split('=')[1];
  if (cookieLang && ['pt', 'en', 'fr'].includes(cookieLang)) {
    return cookieLang;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['pt', 'en', 'fr'].includes(browserLang)) {
    return browserLang;
  }

  return 'pt';
}

/**
 * Carrega os metadados da notícia no idioma especificado.
 */
async function loadNewsMetadata(slug, lang) {
  try {
    const response = await fetch(`/news/${slug}/news-${lang}.md`);
    if (!response.ok) {
      return null;
    }
    const content = await response.text();
    const { data } = matter(content);
    return data;
  } catch (err) {
    console.error(`[NewsPage] Error loading news metadata for ${slug} in ${lang}:`, err);
    return null;
  }
}

function NewsListPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { locale } = useLocaleContext();
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('pt');

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const lang = getPreferredLanguage();
    setCurrentLanguage(lang);
  }, [searchParams]);

  async function loadNews() {
    try {
      setLoading(true);
      const response = await fetch('/news/index.json');
      if (!response.ok) {
        throw new Error(t('news.errorLoadList'));
      }
      const data = await response.json();
      const newsList = data.news || [];

      const lang = getPreferredLanguage();
      const newsWithMetadata = await Promise.all(
        newsList.map(async (item) => {
          let metadata = await loadNewsMetadata(item.slug, lang);

          if (!metadata && item.defaultLanguage) {
            metadata = await loadNewsMetadata(item.slug, item.defaultLanguage);
          }

          if (!metadata && item.availableLanguages && item.availableLanguages.length > 0) {
            metadata = await loadNewsMetadata(item.slug, item.availableLanguages[0]);
          }

          return {
            ...item,
            metadata,
            displayLanguage: metadata?.lang || item.defaultLanguage || 'pt'
          };
        })
      );

      // Sort by date descending (most recent first)
      newsWithMetadata.sort((a, b) => {
        const dateA = a.metadata?.date || a.date || '';
        const dateB = b.metadata?.date || b.date || '';
        return dateB.localeCompare(dateA);
      });

      setNewsItems(newsWithMetadata);
    } catch (err) {
      console.error('[NewsPage] Error loading news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={18} /> {t('common.back')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('news.title')}</h1>
        </div>
      </header>

      <div className="border-t border-slate-800 pt-6" />

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Spinner size={24} className="text-brand-400" />
        </div>
      ) : error ? (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <p>{t('news.errorLoading')}: {error}</p>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="card text-center text-slate-400">
          <Newspaper className="mx-auto mb-3 text-brand-400" size={32} />
          <p>{t('news.noNews')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newsItems.map((item) => (
            <NewsCard
              key={item.slug}
              slug={item.slug}
              title={item.metadata?.title || item.title}
              description={item.metadata?.description || item.description}
              date={item.metadata?.date || item.date}
              category={item.metadata?.category || item.category}
              availableLanguages={item.availableLanguages}
              currentLanguage={item.displayLanguage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsListPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <NewsListPageContent />
    </Suspense>
  );
}
