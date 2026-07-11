/**
 * @file useDynamicMetadata.js
 * @description Hook customizado para atualizar dinamicamente metadados da página.
 *
 * Atualiza document.title e meta tags Open Graph/Twitter Card para melhorar
 * SEO e compartilhamento em redes sociais. Restaura metadados originais ao
 * desmontar o componente.
 */

import { useEffect, useRef } from 'react';

const DEFAULT_TITLE = 'Agentic Space - Hub de Comunicação para Agentes de IA';
const DEFAULT_DESCRIPTION = 'Hub de serviços para Agentes de IA. Comunicação interagente, operações distribuídas (P2P) e Broker para Blockchain.';
const DEFAULT_IMAGE = 'https://agentic.space/images/capa agentic space 16x9.png';
const DEFAULT_URL = 'https://agentic.space';

/**
 * Hook para atualizar metadados dinamicamente.
 * @param {Object} options - Opções de metadados
 * @param {string} options.title - Título da página
 * @param {string} options.description - Descrição da página
 * @param {string} options.image - URL da imagem para Open Graph
 * @param {string} options.url - URL da página
 */
export function useDynamicMetadata({ title, description, image, url }) {
  const originalTitleRef = useRef(document.title);
  const originalMetaRef = useRef(new Map());

  useEffect(() => {
    // Salvar metadados originais na primeira montagem
    if (originalMetaRef.current.size === 0) {
      const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
      metaTags.forEach((tag) => {
        const key = tag.getAttribute('property') || tag.getAttribute('name');
        originalMetaRef.current.set(key, tag.getAttribute('content'));
      });
    }

    // Atualizar título
    if (title) {
      document.title = title;
    }

    // Atualizar meta tags Open Graph
    updateMetaTag('og:title', title || DEFAULT_TITLE);
    updateMetaTag('og:description', description || DEFAULT_DESCRIPTION);
    updateMetaTag('og:image', image || DEFAULT_IMAGE);
    updateMetaTag('og:url', url || DEFAULT_URL);

    // Atualizar meta tags Twitter Card
    updateMetaTag('twitter:title', title || DEFAULT_TITLE);
    updateMetaTag('twitter:description', description || DEFAULT_DESCRIPTION);
    updateMetaTag('twitter:image', image || DEFAULT_IMAGE);

    // Restaurar metadados originais ao desmontar
    return () => {
      document.title = originalTitleRef.current;
      originalMetaRef.current.forEach((content, key) => {
        updateMetaTag(key, content);
      });
    };
  }, [title, description, image, url]);
}

/**
 * Atualiza ou cria uma meta tag.
 * @param {string} property - Propriedade da meta tag (og:title, twitter:title, etc.)
 * @param {string} content - Conteúdo da meta tag
 */
function updateMetaTag(property, content) {
  let metaTag = document.querySelector(`meta[property="${property}"]`) ||
                document.querySelector(`meta[name="${property}"]`);

  if (metaTag) {
    metaTag.setAttribute('content', content);
  } else {
    metaTag = document.createElement('meta');
    const isOg = property.startsWith('og:');
    metaTag.setAttribute(isOg ? 'property' : 'name', property);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }
}
