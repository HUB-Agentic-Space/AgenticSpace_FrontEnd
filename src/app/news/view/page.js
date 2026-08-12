'use client';

/**
 * @file page.js (rota '/news/view?slug=<slug>')
 * @description Página de visualização de uma notícia específica com suporte a
 * múltiplos idiomas. Segue o mesmo padrão de /tutoriais/view.
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Globe, Newspaper } from 'lucide-react';
import Spinner from '@/components/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import matter from 'gray-matter';
import { formatDate } from '@/components/NewsCard';

const LANGUAGE_NAMES = {
  pt: 'português',
  en: 'inglês',
  fr: 'français',
  es: 'español',
  de: 'Deutsch'
};

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  fr: '🇫🇷',
  es: '🇪🇸',
  de: '🇩🇪'
};

/**
 * Determina o idioma preferido do usuário.
 */
function getPreferredLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'fr', 'es'].includes(urlLang)) {
    return urlLang;
  }

  const cookieLang = document.cookie
    .split('; ')
    .find(row => row.startsWith('preferred_lang='))
    ?.split('=')[1];
  if (cookieLang && ['pt', 'en', 'fr', 'es'].includes(cookieLang)) {
    return cookieLang;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['pt', 'en', 'fr', 'es'].includes(browserLang)) {
    return browserLang;
  }

  return 'pt';
}

function NewsViewerContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const [newsItem, setNewsItem] = useState(null);
  const [content, setContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('pt');
  const [availableLanguages, setAvailableLanguages] = useState(['pt']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (slug) {
      loadNews();
    }
  }, [slug, searchParams]);

  async function loadNews() {
    try {
      setLoading(true);
      setError(null);
      setIsFallback(false);

      const indexResponse = await fetch('/news/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar lista de notícias');
      }
      const indexData = await indexResponse.json();

      const newsData = indexData.news.find(n => n.slug === slug);
      if (!newsData) {
        throw new Error('Notícia não encontrada');
      }

      setAvailableLanguages(newsData.availableLanguages || ['pt']);

      const preferredLang = getPreferredLanguage();
      setCurrentLanguage(preferredLang);

      let contentResponse = await fetch(`/news/${slug}/news-${preferredLang}.md`);
      let loadedLang = preferredLang;

      if (!contentResponse.ok && newsData.defaultLanguage) {
        contentResponse = await fetch(`/news/${slug}/news-${newsData.defaultLanguage}.md`);
        loadedLang = newsData.defaultLanguage;
        setIsFallback(true);
      }

      if (!contentResponse.ok && newsData.availableLanguages && newsData.availableLanguages.length > 0) {
        contentResponse = await fetch(`/news/${slug}/news-${newsData.availableLanguages[0]}.md`);
        loadedLang = newsData.availableLanguages[0];
        setIsFallback(true);
      }

      if (!contentResponse.ok) {
        throw new Error('Conteúdo da notícia não encontrado');
      }

      const contentData = await contentResponse.text();
      const { data, content } = matter(contentData);

      setNewsItem({
        ...newsData,
        title: data.title || newsData.title,
        description: data.description || newsData.description,
        date: data.date || newsData.date,
        category: data.category || newsData.category
      });
      setContent(content);
      setCurrentLanguage(loadedLang);
    } catch (err) {
      console.error('[NewsViewer] Error loading news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageSwitch(lang) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lang);
    window.location.href = `/news/view?slug=${slug}&${params.toString()}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <Link href="/news" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Notícia</h1>
        </header>
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar notícia</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/news" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Newspaper className="text-brand-400" size={28} />
            <div>
              <h1 className="text-3xl font-bold text-white">{newsItem.title}</h1>
              <p className="text-slate-400">{newsItem.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(newsItem.date, currentLanguage)}
                {newsItem.category && (
                  <span className="ml-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-brand-400">
                    {newsItem.category}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Language selector */}
        {availableLanguages.length > 1 && (
          <div className="flex items-center gap-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageSwitch(lang)}
                className={`text-2xl transition-transform hover:scale-110 ${
                  lang === currentLanguage
                    ? 'scale-125 ring-2 ring-brand-500 rounded p-0.5'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title={LANGUAGE_NAMES[lang] || lang}
              >
                {LANGUAGE_FLAGS[lang] || '🏳️'}
              </button>
            ))}
          </div>
        )}
      </header>

      {isFallback && (
        <div className="card border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
          <div className="flex items-start gap-2">
            <Globe size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Notícia em outro idioma</p>
              <p className="text-sm">
                Esta notícia não está disponível no seu idioma preferido. Exibindo versão em {LANGUAGE_NAMES[currentLanguage] || currentLanguage}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="prose prose-invert prose-slate prose-headings:text-white prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-300 prose-a:text-brand-400 prose-strong:text-white prose-code:text-brand-300 prose-pre:bg-slate-800 prose-pre:text-slate-200 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-brand-400 hover:text-brand-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code {...props} className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-brand-300">
                      {children}
                    </code>
                  );
                }
                return (
                  <code {...props} className="block bg-slate-800 p-4 rounded-lg overflow-x-auto text-slate-200">
                    {children}
                  </code>
                );
              },
              h1: ({ node, ...props }) => (
                <h1 {...props} className="text-3xl font-bold text-white mt-8 mb-4" />
              ),
              h2: ({ node, ...props }) => (
                <h2 {...props} className="text-2xl font-bold text-white mt-6 mb-3" />
              ),
              h3: ({ node, ...props }) => (
                <h3 {...props} className="text-xl font-bold text-white mt-4 mb-2" />
              ),
              ul: ({ node, ...props }) => (
                <ul {...props} className="list-disc pl-6 my-4 text-slate-300" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="list-decimal pl-6 my-4 text-slate-300" />
              ),
              li: ({ node, ...props }) => (
                <li {...props} className="my-1" />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote {...props} className="border-l-4 border-brand-500 pl-4 my-4 italic text-slate-400" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function NewsViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <NewsViewerContent />
    </Suspense>
  );
}
