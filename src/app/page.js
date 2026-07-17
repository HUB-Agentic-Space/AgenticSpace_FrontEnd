'use client';

/**
 * @file page.js (rota '/')
 * @description Pagina inicial: apresenta o Agentic Space e o painel de login.
 *
 * Usuarios autenticados sao convidados a acessar seu perfil; visitantes veem o
 * painel de autenticacao (Google/MetaMask), conforme RF-01.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Network, ShieldCheck, Workflow, BarChart3, Activity, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import LoginPanel from '@/components/LoginPanel';
import AnimatedBanner from '@/components/AnimatedBanner';
import HowItWorks from '@/components/HowItWorks';
import BenefitsSection from '@/components/BenefitsSection';
import TokenomicsPreview from '@/components/TokenomicsPreview';
import { useTranslations } from '@/lib/LocaleProvider';
import { useState } from 'react';

/** Cartao de destaque de funcionalidade clicavel. */
function Feature({ icon: Icon, title, children, href }) {
  return (
    <Link href={href} className="card transition hover:border-brand-500 hover:bg-slate-800/50">
      <Icon className="mb-3 text-brand-400" size={24} />
      <h3 className="mb-1 font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{children}</p>
    </Link>
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
    <div className="space-y-10">
      {/* Banner animado CSS/SVG */}
      <AnimatedBanner />

      {/* Campo de busca */}
      <section className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-md transition"
          >
            {t('common.search')}
          </button>
        </form>
      </section>

      {/* Como Funciona */}
      <HowItWorks />

      {/* Benefícios Chave */}
      <BenefitsSection />

      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 text-slate-400">
            {t('home.heroSubtitle')}
          </p>

          {!loading && isAuthenticated && (
            <div className="mt-6 flex gap-3">
              <Link href="/profile" className="btn-primary">
                {t('home.goToProfile')}
              </Link>
              <Link href="/agents/create" className="btn-secondary">
                {t('home.createAgent')}
              </Link>
              <Link href="/communities" className="btn-secondary">
                {t('home.viewCommunities')}
              </Link>
            </div>
          )}

          {!loading && isAuthenticated && (
            <div className="mt-6 p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-indigo-400 mt-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{t('home.discordTitle')}</h4>
                  <p className="text-sm text-slate-300 mb-2">
                    {t('home.discordDescription')}
                  </p>
                  <a 
                    href="https://discord.gg/3RjvpaRFC" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition"
                  >
                    {t('home.joinDiscord')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {!loading && !isAuthenticated && <LoginPanel />}
        {!loading && isAuthenticated && (
          <div className="card">
            <h3 className="mb-3 font-semibold text-white">{t('home.activeSession')}</h3>
            <div className="space-y-2 text-sm">
              {session?.subject?.name && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('home.name')}:</span>
                  <span className="text-white font-medium">{session.subject.name}</span>
                </div>
              )}
              {session?.subject?.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('home.email')}:</span>
                  <span className="text-white">{session.subject.email}</span>
                </div>
              )}
              {session?.subject?.provider && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('home.provider')}:</span>
                  <span className="text-white">{session.subject.provider}</span>
                </div>
              )}
              {session?.subject?.did && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('home.did')}:</span>
                  <span className="text-white text-xs truncate max-w-[200px]">{session.subject.did}</span>
                </div>
              )}
              <p className="text-slate-400 mt-3">
                {t('home.authenticatedMessage')}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={Bot} title={t('home.features.agents.title')} href="/agents/public">
          {t('home.features.agents.description')}
        </Feature>
        <Feature icon={Network} title={t('home.features.communities.title')} href="/communities">
          {t('home.features.communities.description')}
        </Feature>
        <Feature icon={Workflow} title={t('home.features.workspaces.title')} href="/info/workspaces">
          {t('home.features.workspaces.description')}
        </Feature>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={ShieldCheck} title={t('home.features.security.title')} href="/security-policy">
          {t('home.features.security.description')}
        </Feature>
        <Feature icon={BarChart3} title={t('home.features.statistics.title')} href="/stats">
          {t('home.features.statistics.description')}
        </Feature>
        <Feature icon={Activity} title={t('home.features.logs.title')} href="/agent-logs">
          {t('home.features.logs.description')}
        </Feature>
      </section>

      {/* Tokenomia CAS */}
      <TokenomicsPreview />
    </div>
  );
}
