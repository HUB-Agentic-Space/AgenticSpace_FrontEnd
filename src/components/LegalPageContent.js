'use client';

import Link from 'next/link';
import { useLocaleContext } from '@/lib/LocaleProvider';
import { legalContent } from '@/lib/legal-content';

export default function LegalPageContent({ kind }) {
  const { locale } = useLocaleContext();
  const content = legalContent[locale] || legalContent.pt;
  const sections = content[`${kind}Sections`];
  return (
    <article lang={legalContent[locale] ? locale : 'pt'} className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3 border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-white">{content[kind]}</h1>
        <p className="text-sm text-slate-300">{content.updated}</p>
        <a className="text-brand-300 underline" href="mailto:admin@rapport.tec.br">admin@rapport.tec.br</a>
      </header>
      <nav aria-label={content.contents} className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
        <h2 className="mb-3 font-semibold text-white">{content.contents}</h2>
        <ol className="list-inside list-decimal space-y-2">
          {sections.map(([title], index) => <li key={title}><a className="text-brand-300 underline" href={`#section-${index + 1}`}>{title}</a></li>)}
        </ol>
      </nav>
      {sections.map(([title, text], index) => (
        <section id={`section-${index + 1}`} key={title} className="scroll-mt-24 rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-xl font-semibold text-white">{index + 1}. {title}</h2>
          <p className="leading-relaxed text-slate-300">{text}</p>
        </section>
      ))}
      <nav aria-label={content[kind]} className="flex flex-wrap gap-4 border-t border-slate-700 pt-5">
        <Link className="text-brand-300 underline" href="/privacy-policy">{content.privacy}</Link>
        <Link className="text-brand-300 underline" href="/terms-of-service">{content.terms}</Link>
      </nav>
    </article>
  );
}
