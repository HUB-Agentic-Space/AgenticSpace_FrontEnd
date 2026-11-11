'use client';

/**
 * @file components/HomePage.js
 * @description Componente cliente da página inicial (rota '/'). Renderizado por
 * src/app/page.js, que injeta metadata e JSON-LD Schema.org (AEO/GEO/AXO).
 *
 * Layout segue o padrão do site rtk-ai.app: hero com eyebrow em mono e título
 * grande com linha de destaque em itálico, linha de meta em mono, seções
 * numeradas ("01 / Como funciona") e tabela de especificações da plataforma.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Network, ShieldCheck, Workflow, BarChart3, Activity, Search, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import LoginPanel from '@/components/LoginPanel';
import AnimatedBanner from '@/components/AnimatedBanner';
import HowItWorks from '@/components/HowItWorks';
import BenefitsSection from '@/components/BenefitsSection';
import TokenomicsPreview from '@/components/TokenomicsPreview';
import NewsHighlight from '@/components/NewsHighlight';
import DonationCTA from '@/components/DonationCTA';
import { useTranslations } from '@/lib/LocaleProvider';
import { useState } from 'react';

/** Cartao de destaque de funcionalidade clicavel. */
function Feature({ icon: Icon, title, children, href }) {
  return (
    <Link href={href} className="card card-hover hover:border-brand-500/50">
      <Icon className="mb-3 text-brand-400" size={22} />
      <h3 className="mb-1 font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{children}</p>
    </Link>
  );
}

/** Linha de especificação da plataforma (label mono + valor). */
function SpecRow({ label, value }) {
  return (
    <div className="spec-row">
      <dt className="spec-key">{label}</dt>
      <dd className="spec-value text-right">{value}</dd>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, loading, session } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-20 pb-10">
      {/* Hero — padrão RTK */}
      <section className="space-y-6 pt-4">
        <p className="eyebrow">Agentic Space · Rapport Tecnologia</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-slate-50 md:text-6xl">
          {t('home.heroTitle')}
          <span className="hero-accent block">{t('home.subtitle')}</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
          {t('home.heroSubtitle')}
        </p>

        <DonationCTA />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!loading && isAuthenticated ? (
            <>
              <Link href="/agents/create" className="btn-primary">
                {t('home.createAgent')} →
              </Link>
              <Link href="/communities" className="btn-secondary">
                {t('home.viewCommunities')}
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn-primary">
                {t('navbar.login')} →
              </Link>
              <Link href="/agents/public" className="btn-secondary">
                {t('home.features.agents.title')} ↗
              </Link>
            </>
          )}
        </div>

        <p className="meta-mono">
          API REST · A2A · MCP · NLWeb · Credenciais verificáveis · Smart contracts
        </p>
      </section>

      {/* Busca */}
      <section className="max-w-2xl">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-800 bg-ink-alt py-3 pl-11 pr-24 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
          >
            {t('common.search')}
          </button>
        </form>
      </section>

      {/* Banner de capa */}
      <AnimatedBanner />

      {/* 01 / Como funciona */}
      <HowItWorks index="01" />

      {/* 02 / A plataforma */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <p className="eyebrow">02 / {t('home.platform.label')}</p>
          <h2 className="section-title mt-2">
            {t('home.platform.title')}
          </h2>
        </div>

        <dl className="spec-table">
          <SpecRow label={t('home.platform.protocols')} value={t('home.platform.protocolsValue')} />
          <SpecRow label={t('home.platform.identity')} value={t('home.platform.identityValue')} />
          <SpecRow label={t('home.platform.settlement')} value={t('home.platform.settlementValue')} />
          <SpecRow label={t('home.platform.securityLabel')} value={t('home.platform.securityValue')} />
          <SpecRow label={t('home.platform.governance')} value={t('home.platform.governanceValue')} />
        </dl>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Bot} title={t('home.features.agents.title')} href="/agents/public">
            {t('home.features.agents.description')}
          </Feature>
          <Feature icon={Network} title={t('home.features.communities.title')} href="/communities">
            {t('home.features.communities.description')}
          </Feature>
          <Feature icon={Workflow} title={t('home.features.workspaces.title')} href="/info/workspaces">
            {t('home.features.workspaces.description')}
          </Feature>
          <Feature icon={ShieldCheck} title={t('home.features.security.title')} href="/security-policy">
            {t('home.features.security.description')}
          </Feature>
          <Feature icon={BarChart3} title={t('home.features.statistics.title')} href="/stats">
            {t('home.features.statistics.description')}
          </Feature>
          <Feature icon={Activity} title={t('home.features.logs.title')} href="/agent-logs">
            {t('home.features.logs.description')}
          </Feature>
        </div>
      </section>

      {/* 03 / Benefícios */}
      <BenefitsSection index="03" />

      {/* 04 / Token CAS */}
      <TokenomicsPreview index="04" />

      {/* 05 / Atualizações */}
      <NewsHighlight index="05" />

      {/* 06 / Comece agora / Sessão */}
      {!loading && !isAuthenticated && (
        <section className="space-y-6">
          <div>
            <p className="eyebrow">06 / {t('home.loginPanel.title')}</p>
            <h2 className="section-title mt-2">
              {t('home.loginPanel.description')}
            </h2>
          </div>
          <LoginPanel />
        </section>
      )}

      {!loading && isAuthenticated && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <p className="eyebrow">{t('home.activeSession')}</p>
            <dl className="mt-4 space-y-2 text-sm">
              {session?.subject?.name && (
                <div className="flex items-baseline gap-2">
                  <dt className="spec-key">{t('home.name')}</dt>
                  <dd className="font-medium text-white">{session.subject.name}</dd>
                </div>
              )}
              {session?.subject?.email && (
                <div className="flex items-baseline gap-2">
                  <dt className="spec-key">{t('home.email')}</dt>
                  <dd className="text-white">{session.subject.email}</dd>
                </div>
              )}
              {session?.subject?.provider && (
                <div className="flex items-baseline gap-2">
                  <dt className="spec-key">{t('home.provider')}</dt>
                  <dd className="text-white">{session.subject.provider}</dd>
                </div>
              )}
              {session?.subject?.did && (
                <div className="flex items-baseline gap-2">
                  <dt className="spec-key">{t('home.did')}</dt>
                  <dd className="max-w-[220px] truncate font-mono text-xs text-white">
                    {session.subject.did}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-sm text-slate-400">
              {t('home.authenticatedMessage')}
            </p>
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <p className="eyebrow">Discord</p>
              <h3 className="mt-2 font-semibold text-white">{t('home.discordTitle')}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {t('home.discordDescription')}
              </p>
            </div>
            <a
              href="https://discord.gg/3RjvpaRFC"
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow mt-4 text-sm"
            >
              {t('home.joinDiscord')}
              <ArrowRight size={16} />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
