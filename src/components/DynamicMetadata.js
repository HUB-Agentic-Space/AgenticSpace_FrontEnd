/**
 * @file DynamicMetadata.js
 * @description Componente para atualizar metadados dinâmicos da página.
 *
 * Usa o hook useDynamicMetadata para atualizar document.title e meta tags
 * Open Graph/Twitter Card quando os dados são carregados.
 */

import { useDynamicMetadata } from '@/lib/useDynamicMetadata';

/**
 * Componente para atualizar metadados dinâmicos.
 * @param {Object} props - Props do componente
 * @param {string} props.title - Título da página
 * @param {string} props.description - Descrição da página
 * @param {string} props.image - URL da imagem para Open Graph
 * @param {string} props.url - URL da página
 */
export default function DynamicMetadata({ title, description, image, url }) {
  useDynamicMetadata({ title, description, image, url });

  // Este componente não renderiza nada visualmente
  return null;
}
