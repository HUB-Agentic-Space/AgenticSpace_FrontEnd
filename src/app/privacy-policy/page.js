import LegalPageContent from '@/components/LegalPageContent';

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Dados de perfil, credenciais verificáveis, blockchain e direitos de privacidade no Agentic Space.',
  alternates: { canonical: '/privacy-policy' }
};

export default function PrivacyPolicyPage() {
  return <LegalPageContent kind="privacy" />;
}
