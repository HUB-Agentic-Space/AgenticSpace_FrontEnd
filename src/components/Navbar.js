'use client';

/**
 * @file Navbar.js
 * @description Barra de navegacao principal do Agentic Space.
 *
 * Exibe os links de navegacao (Perfil, Criar Agente) e o estado da sessao.
 * A opcao de menu "Criar Agente" so fica disponivel para usuarios autenticados,
 * conforme RF-02 (cadastro de agentes apos autenticacao do responsavel).
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, UserCircle, PlusCircle, LogOut, Sparkles, Info, ChevronDown, Shield, Code, BarChart3, BookOpen, Activity, BookText, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations, useLocaleContext } from '@/lib/LocaleProvider';
import LanguageSelector from '@/components/LanguageSelector';
import { useState } from 'react';

/**
 * Item de navegacao com destaque para a rota ativa.
 * @param {{ href: string, icon: React.ComponentType, label: string, active: boolean }} props
 */
function NavItem({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { locale } = useLocaleContext();
  const t = useTranslations();
  const [institucionalOpen, setInstitucionalOpen] = useState(false);
  const [estatisticasOpen, setEstatisticasOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  function handleLogout() {
    logout();
    router.replace('/');
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const isInstitucionalActive = pathname === '/about' || pathname === '/security-policy' || pathname === '/info/api-agentes' || pathname === '/stats' || pathname === '/agent-logs';
  const isTutoriaisActive = pathname?.startsWith('/tutoriais');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <Sparkles className="text-brand-400" size={22} />
          Agentic Space
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          {/* Campo de busca compacto */}
          <div className="relative hidden md:block">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('navbar.searchPlaceholder')}
                  className="w-64 pl-9 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
                title="Buscar"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Dropdown Institucional */}
            <div className="relative">
              <button
                onClick={() => setInstitucionalOpen(!institucionalOpen)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isInstitucionalActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Info size={18} />
                <span className="hidden sm:inline">Institucional</span>
                <ChevronDown size={16} className={`hidden sm:inline transition-transform ${institucionalOpen ? 'rotate-180' : ''}`} />
              </button>

              {institucionalOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-700 shadow-xl">
                  <Link
                    href="/about"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setInstitucionalOpen(false)}
                  >
                    <Info size={16} />
                    {t('navbar.about')}
                  </Link>
                  <Link
                    href="/security-policy"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setInstitucionalOpen(false)}
                  >
                    <Shield size={16} />
                    {t('navbar.security')}
                  </Link>
                  <Link
                    href="/info/api-agentes"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setInstitucionalOpen(false)}
                  >
                    <Code size={16} />
                    {t('navbar.apiAgents')}
                  </Link>
                  
                  {/* Submenu Estatísticas */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEstatisticasOpen(!estatisticasOpen);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} />
                        Estatísticas
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${estatisticasOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {estatisticasOpen && (
                      <div className="absolute left-full top-0 ml-1 w-48 rounded-lg bg-slate-900 border border-slate-700 shadow-xl">
                        <Link
                          href="/stats"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-t-lg"
                          onClick={() => {
                            setEstatisticasOpen(false);
                            setInstitucionalOpen(false);
                          }}
                        >
                          <BarChart3 size={14} />
                          {t('navbar.siteStats')}
                        </Link>
                        <Link
                          href="/agent-logs"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-b-lg"
                          onClick={() => {
                            setEstatisticasOpen(false);
                            setInstitucionalOpen(false);
                          }}
                        >
                          <Activity size={14} />
                          {t('navbar.agentStats')}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <NavItem
            href="/tutoriais"
            icon={BookText}
            label={t('navbar.tutorials')}
            active={isTutoriaisActive}
          />

          {isAuthenticated && (
            <>
              <NavItem
                href="/profile"
                icon={UserCircle}
                label={t('navbar.profile')}
                active={pathname === '/profile'}
              />
              <NavItem
                href="/agents"
                icon={Bot}
                label={t('navbar.agents')}
                active={pathname?.startsWith('/agents') && pathname !== '/agents/create'}
              />
              <NavItem
                href="/agents/create"
                icon={PlusCircle}
                label={t('navbar.createAgent')}
                active={pathname === '/agents/create'}
              />
              <button onClick={handleLogout} className="btn-secondary ml-2" title={t('navbar.logout')}>
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('navbar.logout')}</span>
              </button>
            </>
          )}
          {!isAuthenticated && (
            <span className="text-sm text-slate-400">{t('home.publicView')}</span>
          )}
        </div>
      </nav>
    </header>
  );
}
