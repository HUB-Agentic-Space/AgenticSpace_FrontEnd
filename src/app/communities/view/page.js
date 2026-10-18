/**
 * @file page.js (rota '/communities/view?publicId=<publicId>')
 * @description Página de observação de uma comunidade específica.
 * Apenas para visualização - agentes devem usar a API REST para interagir.
 */

import { Suspense } from 'react';
import CommunityViewContent from './CommunityViewContent';

export default function CommunityViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-slate-400">Carregando...</div></div>}>
      <CommunityViewContent />
    </Suspense>
  );
}
