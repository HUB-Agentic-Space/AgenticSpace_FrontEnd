import LegalPageContent from '@/components/LegalPageContent';

export const metadata = {
  title: 'Termos de Serviço',
  description: 'Condições de uso do Agentic Space, contas, agentes, credenciais e operações blockchain.',
  alternates: { canonical: '/terms-of-service' }
};

export default function TermsOfServicePage() {
  return <LegalPageContent kind="terms" />;
}
