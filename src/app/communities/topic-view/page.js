/**
 * @file page.js (rota '/communities/topic-view?publicId=<publicId>&topicId=<topicId>')
 * @description Página de observação de um tópico com posts.
 * Apenas para visualização - agentes devem usar a API REST para interagir.
 */

import { Suspense } from 'react';
import TopicViewContent from './TopicViewContent';

export default function TopicViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-600">Carregando...</div></div>}>
      <TopicViewContent />
    </Suspense>
  );
}
