'use client';

/**
 * @file VisitorCounter.js
 * @description Componente de contador de visitantes com tooltip de estatísticas.
 * Mostra o número de visitantes e exibe estatísticas detalhadas ao passar o mouse.
 */

import { useState, useEffect } from 'react';
import { Users, Eye, Bot, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function VisitorCounter() {
  const [counter, setCounter] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Carregar contador apenas quando a página estiver visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCounter();
      }
    };

    // Carregar inicialmente se a página estiver visível
    if (document.visibilityState === 'visible') {
      fetchCounter();
    }

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCounter = async () => {
    try {
      const response = await fetch('/api/v1/stats/counter');
      if (response.ok) {
        const data = await response.json();
        setCounter(data);
      }
    } catch (error) {
      console.error('Erro ao buscar contador:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedStats = async () => {
    try {
      const response = await fetch('/api/v1/stats');
      if (response.ok) {
        const data = await response.json();
        setDetailedStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas detalhadas:', error);
    }
  };

  // Carregar detalhes quando o tooltip é aberto
  useEffect(() => {
    if (showTooltip && !detailedStats) {
      fetchDetailedStats();
    }
  }, [showTooltip, detailedStats]);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="card px-4 py-2 flex items-center gap-2 text-sm">
          <Users className="text-brand-400" size={16} />
          <span className="text-slate-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="card px-4 py-2 flex items-center gap-2 text-sm cursor-pointer hover:border-brand-500 transition">
        <Users className="text-brand-400" size={16} />
        <span className="text-white font-semibold">{counter?.totalVisitors || 0}</span>
        <span className="text-slate-400">visitantes</span>
      </div>

      {showTooltip && detailedStats && (
        <div className="absolute bottom-full right-0 mb-2 w-80 card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-400" />
              Estatísticas do Site
            </h3>
            <Link href="/stats" className="text-xs text-brand-400 hover:text-brand-300">
              Ver detalhes →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={<Users size={16} className="text-brand-400" />}
              label="Visitantes"
              value={detailedStats.totalVisitors}
            />
            <StatItem
              icon={<Eye size={16} className="text-brand-400" />}
              label="Visualizações"
              value={detailedStats.totalPageViews}
            />
            <StatItem
              icon={<Users size={16} className="text-brand-400" />}
              label="Inscritos"
              value={detailedStats.totalUsers}
            />
            <StatItem
              icon={<Bot size={16} className="text-brand-400" />}
              label="Agentes"
              value={detailedStats.totalAgents}
            />
          </div>

          <div className="border-t border-slate-700 pt-3 space-y-2">
            <StatRow
              label="Agentes por usuário"
              value={detailedStats.agentsPerUser.toFixed(2)}
            />
            <StatRow
              label="Média de agentes"
              value={detailedStats.avgAgentsPerUser.toFixed(2)}
            />
            <StatRow
              label="Mediana de agentes"
              value={detailedStats.medianAgentsPerUser.toFixed(2)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700">
            <TrendingUp size={14} className="text-green-400" />
            <span>Clique para ver projeções de crescimento</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-white">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
