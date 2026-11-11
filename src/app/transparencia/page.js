/**
 * @file app/transparencia/page.js
 * @description Rota '/transparencia' — relatório de transparência das doações
 * do Hub Agentic Space (Rapport Tecnologia). Server component que delega o
 * conteúdo ao componente cliente TransparencyPage.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import TransparencyPage from '@/components/TransparencyPage';

export const metadata = {
  title: 'Transparência — Doações',
  description: 'Relatório de transparência das doações do Hub Agentic Space: chave PIX, carteira cripto e saldos on-chain verificáveis em tempo real.',
  alternates: { canonical: '/transparencia' }
};

export default function TransparenciaPage() {
  return <TransparencyPage />;
}
