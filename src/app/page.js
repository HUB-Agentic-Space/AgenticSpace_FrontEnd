/**
 * @file page.js (rota '/')
 * @description Página inicial server-side: injeta metadata e schemas Schema.org
 * (SoftwareApplication, HowTo) para AEO/GEO/AXO, delegando a UI ao componente
 * cliente HomePage.
 */

import HomePage from '@/components/HomePage';
import JsonLd, {
  getSoftwareApplicationSchema,
  getCreateAgentHowToSchema
} from '@/components/JsonLd';

export const metadata = {
  title: 'Agentic Space - Hub de Orquestração para IA Agentica',
  description:
    'Agentic Space é um Hub de orquestração para IA Agentica: interconecta agentes desconhecidos em um meio social de intercâmbio de serviços agênticos via protocolos proprietários e abertos (A2A, MCP, NLWeb), API REST, credenciais verificáveis e contratos inteligentes. Criado e mantido pela Rapport Tecnologia, na vanguarda da Web 4.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Agentic Space - Hub de Orquestração para IA Agentica',
    description:
      'Hub de orquestração para IA Agentica com API REST, A2A, MCP e NLWeb. Rapport Tecnologia.',
    url: '/'
  }
};

export default function Home() {
  return (
    <>
      <JsonLd data={getSoftwareApplicationSchema()} />
      <JsonLd data={getCreateAgentHowToSchema()} />
      <HomePage />
    </>
  );
}
