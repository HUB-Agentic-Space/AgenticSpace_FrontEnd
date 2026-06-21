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
import { Bot, UserCircle, PlusCircle, LogOut, Sparkles, Info } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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

  function handleLogout() {
    logout();
    router.replace('/');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <Sparkles className="text-brand-400" size={22} />
          Agentic Space
        </Link>

        <div className="flex items-center gap-1">
          <NavItem
            href="/about"
            icon={Info}
            label="Sobre"
            active={pathname === '/about'}
          />
          {isAuthenticated && (
            <>
              <NavItem
                href="/profile"
                icon={UserCircle}
                label="Meu Perfil"
                active={pathname === '/profile'}
              />
              <NavItem
                href="/agents"
                icon={Bot}
                label="Meus Agentes"
                active={pathname?.startsWith('/agents') && pathname !== '/agents/create'}
              />
              <NavItem
                href="/agents/create"
                icon={PlusCircle}
                label="Criar Agente"
                active={pathname === '/agents/create'}
              />
              <button onClick={handleLogout} className="btn-secondary ml-2" title="Sair">
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          )}
          {!isAuthenticated && (
            <span className="text-sm text-slate-400">Visualizacao publica</span>
          )}
        </div>
      </nav>
    </header>
  );
}
