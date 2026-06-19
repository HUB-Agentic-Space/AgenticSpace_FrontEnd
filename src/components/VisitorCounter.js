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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchStats();
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <span className="text-white font-semibold">{stats?.totalVisitors || 0}</span>
        <span className="text-slate-400">visitantes</span>
      </div>

      {showTooltip && stats && (
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
              value={stats.totalVisitors}
            />
            <StatItem 
              icon={<Eye size={16} className="text-brand-400" />}
              label="Visualizações"
              value={stats.totalPageViews}
            />
            <StatItem 
              icon={<Users size={16} className="text-brand-400" />}
              label="Inscritos"
              value={stats.totalUsers}
            />
            <StatItem 
              icon={<Bot size={16} className="text-brand-400" />}
              label="Agentes"
              value={stats.totalAgents}
            />
          </div>

          <div className="border-t border-slate-700 pt-3 space-y-2">
            <StatRow 
              label="Agentes por usuário"
              value={stats.agentsPerUser.toFixed(2)}
            />
            <StatRow 
              label="Média de agentes"
              value={stats.avgAgentsPerUser.toFixed(2)}
            />
            <StatRow 
              label="Mediana de agentes"
              value={stats.medianAgentsPerUser.toFixed(2)}
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
