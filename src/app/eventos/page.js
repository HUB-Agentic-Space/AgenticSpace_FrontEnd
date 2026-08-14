'use client';

/**
 * @file page.js (rota '/eventos')
 * @description Página de listagem de eventos programados no Agentic Space.
 * Lê os arquivos JSON da pasta public/eventos e exibe os eventos disponíveis,
 * ordenados por data (mais recente primeiro), com suporte a múltiplos idiomas.
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useTranslations } from '@/lib/LocaleProvider';
import EventCard from '@/components/EventCard';
import matter from 'gray-matter';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

/**
 * Determina o idioma preferido do usuário.
 */
function getPreferredLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'es', 'fr', 'de'].includes(urlLang)) {
    return urlLang;
  }

  const cookieLang = document.cookie
    .split('; ')
    .find(row => row.startsWith('preferred_lang='))
    ?.split('=')[1];
  if (cookieLang && ['pt', 'en', 'es', 'fr', 'de'].includes(cookieLang)) {
    return cookieLang;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['pt', 'en', 'es', 'fr', 'de'].includes(browserLang)) {
    return browserLang;
  }

  return 'pt';
}

/**
 * Carrega os metadados do evento no idioma especificado.
 */
async function loadEventMetadata(slug, lang) {
  try {
    const response = await fetch(`/eventos/${slug}/evento-${lang}.md`);
    if (!response.ok) {
      return null;
    }
    const content = await response.text();
    const { data } = matter(content);
    return data;
  } catch (err) {
    console.error(`[EventosPage] Error loading event metadata for ${slug} in ${lang}:`, err);
    return null;
  }
}

function EventosPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('pt');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const lang = getPreferredLanguage();
    setCurrentLanguage(lang);
  }, [searchParams]);

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await fetch('/eventos/index.json');
      if (!response.ok) {
        throw new Error(t('events.errorLoadList'));
      }
      const data = await response.json();
      const eventsList = data.events || [];

      const lang = getPreferredLanguage();
      const eventsWithMetadata = await Promise.all(
        eventsList.map(async (event) => {
          let metadata = await loadEventMetadata(event.slug, lang);

          if (!metadata && event.defaultLanguage) {
            metadata = await loadEventMetadata(event.slug, event.defaultLanguage);
          }

          if (!metadata && event.availableLanguages && event.availableLanguages.length > 0) {
            metadata = await loadEventMetadata(event.slug, event.availableLanguages[0]);
          }

          return {
            ...event,
            metadata,
            displayLanguage: metadata?.lang || event.defaultLanguage || 'pt'
          };
        })
      );

      // Sort by date descending (most recent first)
      eventsWithMetadata.sort((a, b) => {
        const dateA = a.metadata?.date || a.date || '';
        const dateB = b.metadata?.date || b.date || '';
        return dateB.localeCompare(dateA);
      });

      setEvents(eventsWithMetadata);
    } catch (err) {
      console.error('[EventosPage] Error loading events:', err);
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
          <h1 className="text-3xl font-bold text-white">{t('events.title')}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{t('tutorials.currentLanguage')}:</span>
          <span className="text-2xl">{LANGUAGE_FLAGS[currentLanguage] || '🏳️'}</span>
        </div>
      </header>

      <div className="border-t border-slate-800 pt-6" />

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Spinner size={24} className="text-brand-400" />
        </div>
      ) : error ? (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <p>{t('events.errorLoading')}: {error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center text-slate-400">
          <Calendar className="mx-auto mb-3 text-brand-400" size={32} />
          <p>{t('events.noEvents')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.slug}
              slug={event.slug}
              title={event.metadata?.title || event.title}
              description={event.metadata?.description || event.description}
              date={event.metadata?.date || event.date}
              time={event.metadata?.time}
              timezone={event.metadata?.timezone}
              category={event.metadata?.category || event.category}
              status={event.metadata?.status || event.status}
              availableLanguages={event.availableLanguages}
              currentLanguage={event.displayLanguage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <EventosPageContent />
    </Suspense>
  );
}
