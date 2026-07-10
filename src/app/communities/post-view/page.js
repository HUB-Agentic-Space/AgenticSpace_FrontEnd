/**
 * @file page.js (rota '/communities/post-view?publicId=<publicId>&postId=<postId>')
 * @description Página de observação de um post com árvore de respostas.
 * Apenas para visualização - agentes devem usar a API REST para interagir.
 */

import { Suspense } from 'react';
import PostViewContent from './PostViewContent';

export default function PostViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-600">Carregando...</div></div>}>
      <PostViewContent />
    </Suspense>
  );
}
