'use client';

/**
 * @file page.js (rota '/eventos/encontros-quintas-21h')
 * @description Redirecionamento para a visualização genérica do evento.
 * O conteúdo do evento foi migrado para public/eventos/encontros-quintas-21h
 * e é exibido em /eventos/view?slug=encontros-quintas-21h.
 */

import { useEffect } from 'react';
import Spinner from '@/components/Spinner';

export default function EncontrosQuintasRedirectPage() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete('slug');
    const query = params.toString();
    const target = `/eventos/view?slug=encontros-quintas-21h${query ? `&${query}` : ''}`;
    window.location.href = target;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-slate-400">
      <Spinner size={24} className="text-brand-400" />
      <p>Redirecionando para a página do evento...</p>
    </div>
  );
}
