'use client';

/**
 * @file NewsHighlight.js
 * @description Componente que exibe as 3 notícias mais recentes na página principal.
 * Carrega notícias de /news/index.json, ordena por data (mais recente primeiro),
 * e exibe as 3 primeiras com um link em destaque para a página de listagem completa.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslations, useLocaleContext } from '@/lib/LocaleProvider';
import NewsCard, { formatDate } from '@/components/NewsCard';
import matter from 'gray-matter';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  fr: '🇫🇷'
};

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

async function loadNewsMetadata(slug, lang) {
  try {
    const response = await fetch(`/news/${slug}/news-${lang}.md`);
    if (!response.ok) return null;
    const content = await response.text();
    const { data } = matter(content);
    return data;
  } catch {
    return null;
  }
}

export default function NewsHighlight() {
  const t = useTranslations();
  const { locale } = useLocaleContext();
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLatestNews() {
      try {
        setLoading(true);
        const response = await fetch('/news/index.json');
        if (!response.ok) return;
        const data = await response.json();
        const newsList = data.news || [];

        const lang = getPreferredLanguage();
        const newsWithMeta = await Promise.all(
          newsList.map(async (item) => {
            let metadata = await loadNewsMetadata(item.slug, lang);
            if (!metadata && item.defaultLanguage) {
              metadata = await loadNewsMetadata(item.slug, item.defaultLanguage);
            }
            if (!metadata && item.availableLanguages?.length > 0) {
              metadata = await loadNewsMetadata(item.slug, item.availableLanguages[0]);
            }
            return {
              ...item,
              metadata,
              displayLanguage: metadata?.lang || item.defaultLanguage || 'pt'
            };
          })
        );

        newsWithMeta.sort((a, b) => {
          const dateA = a.metadata?.date || a.date || '';
          const dateB = b.metadata?.date || b.date || '';
          return dateB.localeCompare(dateA);
        });

        setLatestNews(newsWithMeta.slice(0, 3));
      } catch (err) {
        console.error('[NewsHighlight] Error loading news:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLatestNews();
  }, []);

  if (loading || latestNews.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-yellow-400" size={24} />
          <h2 className="text-2xl font-bold text-white">{t('news.highlightTitle')}</h2>
        </div>
        <Link
          href="/news"
          className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition"
        >
          {t('news.viewAll')}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {latestNews.map((item) => (
          <NewsCard
            key={item.slug}
            slug={item.slug}
            title={item.metadata?.title || item.title}
            description={item.metadata?.description || item.description}
            date={item.metadata?.date || item.date}
            category={item.metadata?.category || item.category}
            availableLanguages={item.availableLanguages}
            currentLanguage={item.displayLanguage}
            featured
          />
        ))}
      </div>
    </section>
  );
}
