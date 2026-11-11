'use client';

/**
 * @file Footer.js
 * @description Rodape padrao exibido em todas as paginas do frontend.
 *
 * Layout em colunas no estilo RTK: marca + descricao em mono a esquerda,
 * grupos de links com titulos em mono uppercase, e barra inferior com
 * copyright. Mantem os dados institucionais da Rapport Tecnologia.
 */

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useLocaleContext, useTranslations } from '@/lib/LocaleProvider';
import { legalContent } from '@/lib/legal-content';

/** Titulo de coluna do rodape no padrao mono do RTK. */
function ColumnTitle({ children }) {
  return (
    <h3 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
      {children}
    </h3>
  );
}

/** Link de rodape com estilo discreto e hover em brand. */
function FooterLink({ href, children, external = false }) {
  const className =
    'block text-sm text-slate-400 transition hover:text-brand-300';
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} inline-flex items-center gap-1.5`}
      >
        {children}
        <ExternalLink size={12} className="opacity-60" />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const t = useTranslations();
  const { locale } = useLocaleContext();
  const legal = legalContent[locale] || legalContent.pt;

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-brand-500/40 bg-brand-500/15 font-mono text-[11px] font-bold text-brand-400">
                AS
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Agentic Space
              </span>
            </div>
            <p className="font-mono text-xs leading-relaxed text-slate-500">
              Hub de Orquestração para IA Agentica
              <br />
              A2A · MCP · NLWeb · API REST
            </p>
            <p className="text-sm text-slate-400">
              {t('footer.companyName')}
            </p>
          </div>

          {/* Empresa */}
          <div className="space-y-3">
            <ColumnTitle>{t('navbar.about')}</ColumnTitle>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">
                Rapport Tecnologia
              </p>
              <p className="text-sm text-slate-400">
                <span className="font-mono text-xs text-slate-500">
                  {t('footer.cnpjLabel')}:
                </span>{' '}
                67.904.299/0001-80
              </p>
              <p className="text-sm text-slate-400">
                <span className="font-mono text-xs text-slate-500">
                  {t('footer.ceoCto')}:
                </span>{' '}
                Carlos Delfino
              </p>
              <p className="text-sm text-slate-400">
                <span className="font-mono text-xs text-slate-500">
                  {t('footer.emailLabel')}:
                </span>{' '}
                <a
                  href="mailto:admin@rapport.tec.br"
                  className="transition hover:text-brand-300"
                >
                  admin@rapport.tec.br
                </a>
              </p>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-3">
            <ColumnTitle>{t('footer.contact')}</ColumnTitle>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                {t('footer.whatsappPrincipal')}
              </p>
              <FooterLink href="https://wa.me/5585985205490" external>
                85 98520-5490
              </FooterLink>
              <FooterLink href="mailto:admin@rapport.tec.br">
                admin@rapport.tec.br
              </FooterLink>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <ColumnTitle>Links</ColumnTitle>
            <div className="space-y-2">
              <FooterLink href="/about">{t('navbar.about')}</FooterLink>
              <FooterLink href="/security-policy">
                {t('footer.securityPolicy')}
              </FooterLink>
              <FooterLink href="/privacy-policy">{legal.privacy}</FooterLink>
              <FooterLink href="/terms-of-service">{legal.terms}</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
              <FooterLink href="https://discord.gg/3RjvpaRFC" external>
                Discord
              </FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">{t('footer.copyright')}</p>
          <p className="font-mono text-xs text-slate-600">
            Rapport Tecnologia · Web 4
          </p>
        </div>
      </div>
    </footer>
  );
}
