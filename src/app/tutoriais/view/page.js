'use client';

/**
 * @file page.js (rota '/tutoriais/view?slug=<slug>')
 * @description Página de visualização de um tutorial específico com suporte a múltiplos idiomas.
 *
 * Esta rota usa query string para evitar problemas com exportação estática
 * do Next.js (`output: 'export'`), seguindo o mesmo padrão de /agents/view.
 * O slug do tutorial é lido em tempo de execução a partir da query string.
 * Suporta carregamento de tutoriais em diferentes idiomas com fallback.
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Globe } from 'lucide-react';
import Spinner from '@/components/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import matter from 'gray-matter';
import TutorialLanguageSelector from '@/components/TutorialLanguageSelector';

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

function TutorialViewerContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const [tutorial, setTutorial] = useState(null);
  const [content, setContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('pt');
  const [availableLanguages, setAvailableLanguages] = useState(['pt']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTutorial();
    }
  }, [slug, searchParams]);

  async function loadTutorial() {
    try {
      setLoading(true);
      setError(null);
      setIsFallback(false);

      // Carregar lista de tutoriais para obter metadados
      const indexResponse = await fetch('/tutoriais/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar lista de tutoriais');
      }
      const indexData = await indexResponse.json();

      // Encontrar o tutorial pelo slug
      const tutorialData = indexData.tutorials.find(t => t.slug === slug);
      if (!tutorialData) {
        throw new Error('Tutorial não encontrado');
      }

      setAvailableLanguages(tutorialData.availableLanguages || ['pt']);

      // Determinar idioma preferido
      const preferredLang = getPreferredLanguage();
      setCurrentLanguage(preferredLang);

      // Tentar carregar no idioma preferido
      let contentResponse = await fetch(`/tutoriais/${slug}/tutorial-${preferredLang}.md`);
      let loadedLang = preferredLang;

      // Fallback para idioma padrão se preferido não disponível
      if (!contentResponse.ok && tutorialData.defaultLanguage) {
        contentResponse = await fetch(`/tutoriais/${slug}/tutorial-${tutorialData.defaultLanguage}.md`);
        loadedLang = tutorialData.defaultLanguage;
        setIsFallback(true);
      }

      // Fallback para primeiro idioma disponível
      if (!contentResponse.ok && tutorialData.availableLanguages && tutorialData.availableLanguages.length > 0) {
        contentResponse = await fetch(`/tutoriais/${slug}/tutorial-${tutorialData.availableLanguages[0]}.md`);
        loadedLang = tutorialData.availableLanguages[0];
        setIsFallback(true);
      }

      if (!contentResponse.ok) {
        throw new Error('Conteúdo do tutorial não encontrado');
      }

      const contentData = await contentResponse.text();
      const { data, content } = matter(contentData);

      setTutorial({
        ...tutorialData,
        title: data.title || tutorialData.title,
        description: data.description || tutorialData.description
      });
      setContent(content);
      setCurrentLanguage(loadedLang);
    } catch (err) {
      console.error('[TutorialViewer] Error loading tutorial:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <Link href="/tutoriais" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Tutorial</h1>
        </header>
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar tutorial</p>
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
          <Link href="/tutoriais" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-400" size={28} />
            <div>
              <h1 className="text-3xl font-bold text-white">{tutorial.title}</h1>
              <p className="text-slate-400">{tutorial.description}</p>
            </div>
          </div>
        </div>
        <TutorialLanguageSelector
          slug={slug}
          availableLanguages={availableLanguages}
          currentLanguage={currentLanguage}
        />
      </header>

      {isFallback && (
        <div className="card border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
          <div className="flex items-start gap-2">
            <Globe size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Tutorial em outro idioma</p>
              <p className="text-sm">
                Este tutorial não está disponível no seu idioma preferido. Exibindo versão em {currentLanguage === 'pt' ? 'português' : currentLanguage === 'en' ? 'inglês' : currentLanguage}.
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
    </div>
  );
}

export default function TutorialViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <TutorialViewerContent />
    </Suspense>
  );
}
