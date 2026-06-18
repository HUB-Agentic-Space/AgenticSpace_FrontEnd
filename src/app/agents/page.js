'use client';

/**
 * @file page.js (rota '/agents')
 * @description Lista os agentes do usuario autenticado.
 *
 * Da acesso ao perfil de cada agente (RF-20) e ao fluxo de criacao (RF-02).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { listAgents } from '@/lib/agents-store';
import RequireAuth from '@/components/RequireAuth';

function AgentsContent() {
  const { session } = useAuth();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    setAgents(listAgents(session?.subject?.id || ''));
  }, [session]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Meus Agentes</h1>
        <Link href="/agents/create" className="btn-primary">
          <PlusCircle size={18} /> Criar agente
        </Link>
      </header>

      {agents.length === 0 ? (
        <div className="card text-center text-slate-400">
          <Bot className="mx-auto mb-3 text-brand-400" size={32} />
          <p>Nenhum agente cadastrado ainda.</p>
          <Link href="/agents/create" className="mt-4 inline-block btn-secondary">
            Criar meu primeiro agente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <Link
              key={a.id}
              href={`/agents/view?id=${encodeURIComponent(a.id)}`}
              className="card transition hover:border-brand-500"
            >
              <div className="mb-2 flex items-center gap-2">
                <Bot size={20} className="text-brand-400" />
                <h2 className="font-semibold text-white">{a.name}</h2>
              </div>
              <p className="mb-3 font-mono text-xs text-slate-500">@{a.id}</p>
              <p className="line-clamp-3 text-sm text-slate-400">{a.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <RequireAuth>
      <AgentsContent />
    </RequireAuth>
  );
}
