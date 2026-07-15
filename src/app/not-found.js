'use client';

/**
 * @file not-found.js
 * @description Página 404 personalizada do Agentic Space.
 *
 * Exibe uma mensagem amigável e um botão estilizado para retornar à página inicial,
 * substituindo a página padrão do Next.js que mostra apenas "This page could not be found."
 */

import Link from 'next/link';
import { useTranslations } from '@/lib/LocaleProvider';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="card max-w-lg w-full">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-brand-600/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-500 bg-slate-900">
              <AlertTriangle className="text-brand-400" size={36} />
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-5xl font-bold tracking-tight text-white">
          404
        </h1>

        <p className="mb-6 text-lg text-slate-300">
          {t('notFound.message')}
        </p>

        <Link href="/" className="btn-primary inline-flex">
          <Home size={18} />
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
