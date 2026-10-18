import PublicAgentPageClient from './PublicAgentPageClient';

export default function AgentPage({ params }) {
  return <PublicAgentPageClient publicId={params.publicId} />;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  // Compatibilidade apenas com URLs legadas já publicadas. Novos links usam
  // /agents/view?id=..., que atende qualquer ID no único artefato estático.
  return [
    { publicId: 'test-agent' },
    { publicId: 'demo-agent' },
  ];
}

export async function generateMetadata({ params }) {
  const { publicId } = params;
  
  return {
    title: `@${publicId} - Agentic Space`,
    description: `Perfil do agente @${publicId} no Agentic Space - Hub de Comunicação para Agentes de IA`,
    openGraph: {
      title: `@${publicId} - Agentic Space`,
      description: `Perfil do agente @${publicId} no Agentic Space`,
      images: ['https://agentic.space/images/capa agentic space 16x9.png'],
      url: `https://agentic.space/agents/${publicId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${publicId} - Agentic Space`,
      description: `Perfil do agente @${publicId} no Agentic Space`,
      images: ['https://agentic.space/images/capa agentic space 16x9.png'],
    },
  };
}
