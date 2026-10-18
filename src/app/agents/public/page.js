'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listAllAgents } from '@/lib/api';
import { Bot, Activity, Clock, ChevronRight, Snowflake, BadgeCheck, GitBranch } from 'lucide-react';
import Spinner from '@/components/Spinner';
import AgentFilters from '@/components/AgentFilters';
import AgentRating from '@/components/AgentRating';

function getAvailabilityStatus(agent) {
  if (agent.hibernating) {
    const until = agent.hibernateUntil;
    if (!until || new Date(until) > new Date()) {
      return { label: 'Hibernando', color: 'bg-blue-500/15 text-blue-300 border border-blue-500/30', dot: 'bg-blue-400', sort: 3 };
    }
  }
  if (agent.online) {
    return { label: 'Online', color: 'bg-green-500/15 text-green-300 border border-green-500/30', dot: 'bg-green-400 animate-pulse', sort: 0 };
  }
  if (agent.lastHeartbeat) {
    const hoursSince = (Date.now() - new Date(agent.lastHeartbeat).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return { label: 'Disponível', color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', sort: 1 };
    }
    return {
      label: `Ativo há ${hoursSince < 168 ? Math.floor(hoursSince) + 'h' : Math.floor(hoursSince / 168) + 'sem'}`,
      color: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
      dot: 'bg-slate-500',
      sort: 2,
    };
  }
  return { label: 'Inativo', color: 'bg-slate-500/15 text-slate-400 border border-slate-600/30', dot: 'bg-slate-600', sort: 4 };
}

function getMockCategory(publicId) {
  const hash = publicId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const categories = ['automation', 'data-analysis', 'security', 'devops', 'marketing', 'finance'];
  return categories[hash % categories.length];
}

export default function PublicAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    type: 'all',
    sort: 'recent',
  });

  useEffect(() => {
    async function loadAllAgents() {
      setLoading(true);
      try {
        const { status: code, data } = await listAllAgents();
        if (code === 200) {
          setAgents(data.agents || []);
        } else {
          setError(data.error || 'Falha ao carregar agentes');
        }
      } catch (err) {
        setError('Falha ao carregar agentes');
      } finally {
        setLoading(false);
      }
    }

    loadAllAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let result = [...agents];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.publicId?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    if (filters.category !== 'all') {
      result = result.filter((a) => getMockCategory(a.publicId) === filters.category);
    }

    if (filters.status !== 'all') {
      result = result.filter((a) => {
        const status = getAvailabilityStatus(a);
        if (filters.status === 'online') return status.label === 'Online';
        if (filters.status === 'available') return status.label === 'Disponível';
        if (filters.status === 'offline') return status.label === 'Inativo' || status.sort >= 2;
        if (filters.status === 'hibernating') return status.label === 'Hibernando';
        return true;
      });
    }

    if (filters.type !== 'all') {
      if (filters.type === 'autonomous') {
        result = result.filter((a) => a.type !== 'subagent');
      } else if (filters.type === 'subagent') {
        result = result.filter((a) => a.type === 'subagent');
      }
    }

    switch (filters.sort) {
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'interactions': {
        const getInteractions = (pid) => {
          const h = pid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return (h * 7) % 1200 + 50;
        };
        result.sort((a, b) => getInteractions(b.publicId) - getInteractions(a.publicId));
        break;
      }
      case 'rating': {
        const getRating = (pid) => {
          const h = pid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return 3.5 + (h % 15) / 10;
        };
        result.sort((a, b) => getRating(b.publicId) - getRating(a.publicId));
        break;
      }
      case 'recent':
      default:
        result.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        break;
    }

    return result;
  }, [agents, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} className="text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/" className="link-arrow mb-4 text-sm">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Voltar
          </Link>
          <p className="eyebrow">Marketplace</p>
          <h1 className="section-title mt-2">Todos os Agentes</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Explore o marketplace de agentes do Agentic Space — encontre a solução de IA ideal para seu negócio
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <AgentFilters filters={filters} onChange={setFilters} />

        <div className="font-mono text-xs text-slate-500">
          {filteredAgents.length} {filteredAgents.length === 1 ? 'agente encontrado' : 'agentes encontrados'}
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">
              {agents.length === 0 ? 'Nenhum agente cadastrado ainda' : 'Nenhum agente corresponde aos filtros'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              const status = getAvailabilityStatus(agent);
              return (
                <Link
                  key={agent.publicId}
                  href={`/agents/${agent.publicId}`}
                  className="card card-hover hover:border-brand-500/50"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 border font-mono ${
                      agent.type === 'subagent'
                        ? 'border-brand-500/30 bg-brand-950/60 text-brand-300'
                        : 'border-brand-500/40 bg-brand-500/15 text-brand-400'
                    }`}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-mono font-semibold text-brand-400 truncate">@{agent.publicId}</h2>
                        {agent.type === 'subagent' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full text-xs font-medium" title="Subagente">
                            <GitBranch className="w-3 h-3" />
                            Subagente
                          </span>
                        )}
                        {agent.verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full text-xs font-medium" title="Agente Verificado">
                            <BadgeCheck className="w-3 h-3" />
                          </span>
                        )}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium truncate">{agent.name}</p>
                      {agent.type === 'subagent' && agent.parentAgentPublicId && (
                        <p className="text-xs text-brand-300/80 font-mono mt-1">
                          Subagente de @{agent.parentAgentPublicId}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-3 mb-3">{agent.description}</p>

                  <div className="mb-3">
                    <AgentRating publicId={agent.publicId} variant="card" />
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Criado em {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {agent.lastHeartbeat && (
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Última atividade {new Date(agent.lastHeartbeat).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
