'use client';

/**
 * @file page.js (rota '/eventos/view?slug=<slug>')
 * @description Página de visualização de um evento específico com suporte a
 * múltiplos idiomas. Segue o mesmo padrão de /tutoriais/view e inclui o
 * formulário de presença dinâmico quando configurado no frontmatter.
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Globe, Calendar, Clock, MapPin } from 'lucide-react';
import Spinner from '@/components/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import matter from 'gray-matter';
import EventAttendanceForm from '@/components/EventAttendanceForm';

const LANGUAGE_NAMES = {
  pt: 'português',
  en: 'inglês',
  es: 'espanhol',
  fr: 'francês',
  de: 'alemão'
};

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
 * Formata uma data (YYYY-MM-DD) para exibição localizada.
 */
function formatDate(dateStr, lang) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const localeMap = { pt: 'pt-BR', en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' };
    return date.toLocaleDateString(localeMap[lang] || 'pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function EventViewerContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const [event, setEvent] = useState(null);
  const [content, setContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('pt');
  const [availableLanguages, setAvailableLanguages] = useState(['pt']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug, searchParams]);

  async function loadEvent() {
    try {
      setLoading(true);
      setError(null);
      setIsFallback(false);

      const indexResponse = await fetch('/eventos/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar lista de eventos');
      }
      const indexData = await indexResponse.json();

      const eventData = indexData.events.find(e => e.slug === slug);
      if (!eventData) {
        throw new Error('Evento não encontrado');
      }

      setAvailableLanguages(eventData.availableLanguages || ['pt']);

      const preferredLang = getPreferredLanguage();
      setCurrentLanguage(preferredLang);

      let contentResponse = await fetch(`/eventos/${slug}/evento-${preferredLang}.md`);
      let loadedLang = preferredLang;

      if (!contentResponse.ok && eventData.defaultLanguage) {
        contentResponse = await fetch(`/eventos/${slug}/evento-${eventData.defaultLanguage}.md`);
        loadedLang = eventData.defaultLanguage;
        setIsFallback(true);
      }

      if (!contentResponse.ok && eventData.availableLanguages && eventData.availableLanguages.length > 0) {
        contentResponse = await fetch(`/eventos/${slug}/evento-${eventData.availableLanguages[0]}.md`);
        loadedLang = eventData.availableLanguages[0];
        setIsFallback(true);
      }

      if (!contentResponse.ok) {
        throw new Error('Conteúdo do evento não encontrado');
      }

      const contentData = await contentResponse.text();
      const { data, content } = matter(contentData);

      setEvent({
        ...eventData,
        title: data.title || eventData.title,
        description: data.description || eventData.description,
        date: data.date || eventData.date,
        time: data.time,
        timezone: data.timezone,
        timezoneLabel: data.timezoneLabel,
        category: data.category || eventData.category,
        status: data.status || eventData.status,
        attendance: data.attendance,
      });
      setContent(content);
      setCurrentLanguage(loadedLang);
    } catch (err) {
      console.error('[EventViewer] Error loading event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageSwitch(lang) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lang);
    window.location.href = `/eventos/view?slug=${slug}&${params.toString()}`;
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
          <Link href="/eventos" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Evento</h1>
        </header>
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar evento</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = event.date ? formatDate(event.date, currentLanguage) : null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/eventos" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Calendar className="text-brand-400" size={28} />
            <div>
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <p className="text-slate-400">{event.description}</p>
              {(formattedDate || event.time || event.timezone) && (
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {formattedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formattedDate}
                    </span>
                  )}
                  {event.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {event.time}
                    </span>
                  )}
                  {event.timezone && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {event.timezoneLabel || event.timezone}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

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
              <p className="font-semibold">Evento em outro idioma</p>
              <p className="text-sm">
                Este evento não está disponível no seu idioma preferido. Exibindo versão em {LANGUAGE_NAMES[currentLanguage] || currentLanguage}.
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
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded-lg border border-slate-700 my-4"
                  alt={props.alt || ''}
                />
              ),
              a: ({ node, ...props }) => {
                const isInternal = props.href?.startsWith('/');
                return (
                  <a
                    {...props}
                    className="text-brand-400 hover:text-brand-300 underline"
                    target={isInternal ? undefined : '_blank'}
                    rel={isInternal ? undefined : 'noopener noreferrer'}
                  />
                );
              },
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
              pre: ({ node, ...props }) => (
                <pre {...props} className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4">
                  {props.children}
                </pre>
              ),
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

      {event.attendance && (
        <EventAttendanceForm
          config={event.attendance}
          title="Formulário de Presença"
          description="Preencha o formulário abaixo para registrar sua presença no encontro de hoje e garantir seu certificado de participação:"
        />
      )}
    </div>
  );
}

export default function EventViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <EventViewerContent />
    </Suspense>
  );
}
