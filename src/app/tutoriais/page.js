'use client';

/**
 * @file page.js (rota '/tutoriais')
 * @description Página de listagem de tutoriais disponíveis no Agentic Space.
 * Lê os arquivos JSON da pasta public/tutoriais e exibe os tutoriais disponíveis
 * com suporte a múltiplos idiomas.
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookText } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useTranslations } from '@/lib/LocaleProvider';
import TutorialCard from '@/components/TutorialCard';
import matter from 'gray-matter';
const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

/**
 * Determina o idioma preferido do usuário com base em:
 * 1. Parâmetro URL ?lang=
 * 2. Cookie de preferência
 * 3. Accept-Language do navegador
 * 4. Padrão: 'pt'
 */
function getPreferredLanguage() {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'es', 'fr', 'de'].includes(urlLang)) {
    return urlLang;
  }

  // Check cookie
  const cookieLang = document.cookie
    .split('; ')
    .find(row => row.startsWith('preferred_lang='))
    ?.split('=')[1];
  if (cookieLang && ['pt', 'en', 'es', 'fr', 'de'].includes(cookieLang)) {
    return cookieLang;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (['pt', 'en', 'es', 'fr', 'de'].includes(browserLang)) {
    return browserLang;
  }

  // Default to Portuguese
  return 'pt';
}

/**
 * Carrega os metadados do tutorial no idioma especificado
 */
async function loadTutorialMetadata(slug, lang) {
  try {
    const response = await fetch(`/tutoriais/${slug}/tutorial-${lang}.md`);
    if (!response.ok) {
      return null;
    }
    const content = await response.text();
    const { data } = matter(content);
    return data;
  } catch (err) {
    console.error(`[TutoriaisPage] Error loading tutorial metadata for ${slug} in ${lang}:`, err);
    return null;
  }
}

function TutoriaisPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('pt');

  useEffect(() => {
    loadTutorials();
  }, []);

  useEffect(() => {
    const lang = getPreferredLanguage();
    setCurrentLanguage(lang);
  }, [searchParams]);

  async function loadTutorials() {
    try {
      setLoading(true);
      // Buscar a lista de tutoriais do diretório public/tutoriais
      const response = await fetch('/tutoriais/index.json');
      if (!response.ok) {
        throw new Error(t('tutorials.errorLoadList'));
      }
      const data = await response.json();
      const tutorialsList = data.tutorials || [];

      // Carregar metadados para cada tutorial no idioma preferido
      const lang = getPreferredLanguage();
      const tutorialsWithMetadata = await Promise.all(
        tutorialsList.map(async (tutorial) => {
          // Try to load metadata in preferred language
          let metadata = await loadTutorialMetadata(tutorial.slug, lang);

          // Fallback to default language if preferred not available
          if (!metadata && tutorial.defaultLanguage) {
            metadata = await loadTutorialMetadata(tutorial.slug, tutorial.defaultLanguage);
          }

          // Fallback to first available language
          if (!metadata && tutorial.availableLanguages && tutorial.availableLanguages.length > 0) {
            metadata = await loadTutorialMetadata(tutorial.slug, tutorial.availableLanguages[0]);
          }

          return {
            ...tutorial,
            metadata,
            displayLanguage: metadata?.lang || tutorial.defaultLanguage || 'pt'
          };
        })
      );

      setTutorials(tutorialsWithMetadata);
    } catch (err) {
      console.error('[TutoriaisPage] Error loading tutorials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('tutorials.title')}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{t('tutorials.currentLanguage')}:</span>
          <span className="text-2xl">{LANGUAGE_FLAGS[currentLanguage] || '🏳️'}</span>
        </div>
      </header>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Spinner size={24} className="text-brand-400" />
        </div>
      ) : error ? (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <p>{t('tutorials.errorLoading')}: {error}</p>
        </div>
      ) : tutorials.length === 0 ? (
        <div className="card text-center text-slate-400">
          <BookText className="mx-auto mb-3 text-brand-400" size={32} />
          <p>{t('tutorials.noTutorials')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.slug}
              slug={tutorial.slug}
              title={tutorial.metadata?.title || tutorial.title}
              description={tutorial.metadata?.description || tutorial.description}
              availableLanguages={tutorial.availableLanguages}
              currentLanguage={tutorial.displayLanguage}
              thumb={tutorial.thumb}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TutoriaisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <TutoriaisPageContent />
    </Suspense>
  );
}
