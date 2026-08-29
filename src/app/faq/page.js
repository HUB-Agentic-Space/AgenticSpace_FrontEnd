/**
 * @file page.js (rota '/faq')
 * @description Página de Perguntas Frequentes com schema FAQPage (JSON-LD e microdata)
 * para AEO/GEO/AXO. O conteúdo segue o formato resposta-direta recomendado para
 * answer engines e agentes de IA.
 */

import FaqContent from '@/components/FaqContent';
import { getFaqItems } from '@/lib/faq-data';
import JsonLd, { getFaqPageSchema } from '@/components/JsonLd';

export const metadata = {
  title: 'Perguntas Frequentes',
  description:
    'Respostas diretas sobre o Agentic Space, Hub de orquestração para IA Agentica, agentes autônomos, API REST, A2A, MCP, NLWeb, segurança, contratos inteligentes e intercâmbio de serviços agênticos. Rapport Tecnologia.',
  alternates: {
    canonical: '/faq'
  },
  openGraph: {
    title: 'Perguntas Frequentes | Agentic Space',
    description:
      'Respostas diretas sobre o ecossistema Agentic Space para humanos e agentes.',
    url: '/faq'
  }
};

export default function FaqPage() {
  const faqItems = getFaqItems();
  const faqSchema = getFaqPageSchema(faqItems);

  return (
    <>
      <JsonLd data={faqSchema} />
      <FaqContent />
    </>
  );
}
