import VerifyCertificateClient from './VerifyCertificateClient';

export const metadata = {
  title: 'Verificar certificado | Agentic Space',
  description:
    'Confira o manifesto e o registro blockchain de um certificado emitido pela Raport Tecnologia Inova Simples.',
};

export default function VerifyCertificatePage() {
  return <VerifyCertificateClient />;
}
