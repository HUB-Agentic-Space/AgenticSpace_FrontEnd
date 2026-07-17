'use client';

/**
 * @file GlossaryTooltip.js
 * @description Componente de tooltip/glossário interativo para termos técnicos.
 * Uso: <GlossaryTooltip term="DID">DID</GlossaryTooltip>
 * Mostra definição ao passar o mouse ou clicar (mobile).
 */

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

/**
 * @param {{ term: string, children: React.ReactNode }} props
 */
export default function GlossaryTooltip({ term, children }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const definition = t(`glossary.${term}`);

  if (!definition || definition === `glossary.${term}`) {
    return <span className="text-brand-300">{children}</span>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className="cursor-help border-b border-dashed border-brand-400/50 text-brand-300"
        onClick={() => setOpen(!open)}
      >
        {children}
        <HelpCircle className="ml-0.5 inline-block" size={12} />
      </span>

      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300 shadow-xl">
          <span className="block font-semibold text-brand-400 mb-1">{term}</span>
          <span className="block">{definition}</span>
        </span>
      )}
    </span>
  );
}
