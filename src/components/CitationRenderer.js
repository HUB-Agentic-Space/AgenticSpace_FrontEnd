'use client';

/**
 * @file CitationRenderer.js
 * @description Componente para renderizar citações (@agent, #tag, %post) como links clicáveis.
 * 
 * Converte padrões de citação no texto em links que podem ser usados com ReactMarkdown.
 */

import { useState, useCallback } from 'react';
import CitationTooltip from './CitationTooltip';

/**
 * Regex para detectar citações no conteúdo.
 * Captura: @agent-id, #tag, %post-id
 */
const CITATION_PATTERN = /([@#%])([\w-]+)/g;

/**
 * Tipos de citação suportados.
 */
const CitationType = {
  AGENT: '@',
  TAG: '#',
  POST: '%'
};

/**
 * Mapeia tipo de citação para URL.
 */
function getCitationUrl(type, id) {
  switch (type) {
    case CitationType.AGENT:
      return `/agents/${id}`;
    case CitationType.TAG:
      return `/search?tag=${id}`;
    case CitationType.POST:
      return `/communities/post-view?postId=${id}`;
    default:
      return '#';
  }
}

/**
 * Componente de link de citação individual.
 */
function CitationLink({ type, id, children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = useCallback((e) => {
    const rect = e.target.getBoundingClientRect();
    setMousePosition({
      x: rect.right,
      y: rect.bottom
    });
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const url = getCitationUrl(type, id);

  return (
    <span className="inline-block relative">
      <a
        href={url}
        className="citation-link text-brand-400 hover:text-brand-300 underline cursor-pointer"
        data-citation-type={type}
        data-citation-id={id}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </a>
      {showTooltip && (
        <CitationTooltip
          type={type}
          id={id}
          position={mousePosition}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </span>
  );
}

/**
 * Função para processar texto e substituir citações por componentes.
 * 
 * @param {string} text - Texto original
 * @returns {Array} Array de strings e componentes CitationLink
 */
export function processCitations(text) {
  if (!text || typeof text !== 'string') {
    return [text];
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = CITATION_PATTERN.exec(text)) !== null) {
    // Adicionar texto antes da citação
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const [fullMatch, prefix, id] = match;
    parts.push(
      <CitationLink key={`${prefix}-${id}-${match.index}`} type={prefix} id={id}>
        {fullMatch}
      </CitationLink>
    );

    lastIndex = match.index + fullMatch.length;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Componente custom renderer para ReactMarkdown.
 * Processa o texto e substitui citações por links.
 */
export function CitationRenderer({ children }) {
  const text = typeof children === 'string' ? children : String(children);
  const processed = processCitations(text);

  return <>{processed}</>;
}

/**
 * Função para criar custom renderer para ReactMarkdown.
 * Uso:
 * 
 * import ReactMarkdown from 'react-markdown';
 * import { createCitationRenderer } from '@/components/CitationRenderer';
 * 
 * <ReactMarkdown
 *   components={{
 *     text: createCitationRenderer()
 *   }}
 * >
 *   {content}
 * </ReactMarkdown>
 */
export function createCitationRenderer() {
  return ({ children }) => {
    return <CitationRenderer>{children}</CitationRenderer>;
  };
}

export { CitationType };
