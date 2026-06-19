'use client';

/**
 * @file page.js (rota '/stats')
 * @description Página de estatísticas detalhadas com gráficos e projeções de crescimento.
 * Mostra métricas valiosas para investidores e stakeholders.
 */

import { useState, useEffect } from 'react';
import { Users, Eye, Bot, TrendingUp, BarChart3, ArrowLeft, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projections, setProjections] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        calculateProjections(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjections = (data) => {
    // Calcular projeções de crescimento baseadas nos últimos 30 dias
    const visitsByDay = data.visitsByDay || [];
    const pageViewsByDay = data.pageViewsByDay || [];

    if (visitsByDay.length < 2) {
      setProjections(null);
      return;
    }

    // Calcular taxa de crescimento diária média
    const recentVisits = visitsByDay.slice(-7);
    const growthRate = calculateGrowthRate(recentVisits.map(v => v.visitors));

    // Projetar próximos 30 dias
    const projectedVisits = [];
    const projectedPageViews = [];
    const lastVisitDate = new Date(visitsByDay[visitsByDay.length - 1].date);
    const lastVisitCount = visitsByDay[visitsByDay.length - 1].visitors;
    const lastPageViewCount = pageViewsByDay[pageViewsByDay.length - 1]?.views || 0;

    for (let i = 1; i <= 30; i++) {
      const projectedDate = new Date(lastVisitDate);
      projectedDate.setDate(projectedDate.getDate() + i);
      
      const projectedVisitors = Math.round(lastVisitCount * Math.pow(1 + growthRate, i));
      const projectedViews = Math.round(lastPageViewCount * Math.pow(1 + growthRate, i));

      projectedVisits.push({
        date: projectedDate.toISOString().split('T')[0],
        visitors: projectedVisitors,
        projected: true
      });

      projectedPageViews.push({
        date: projectedDate.toISOString().split('T')[0],
        views: projectedViews,
        projected: true
      });
    }

    setProjections({
      visits: [...visitsByDay, ...projectedVisits],
      pageViews: [...pageViewsByDay, ...projectedPageViews],
      growthRate: growthRate * 100,
      projected30DayVisitors: projectedVisits.reduce((sum, p) => sum + p.visitors, 0),
      projected30DayPageViews: projectedPageViews.reduce((sum, p) => sum + p.views, 0)
    });
  };

  const calculateGrowthRate = (values) => {
    if (values.length < 2) return 0;
    let totalGrowth = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        totalGrowth += (values[i] - values[i - 1]) / values[i - 1];
      }
    }
    return totalGrowth / (values.length - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-400">Erro ao carregar estatísticas.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition">
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-brand-400" size={32} />
            Estatísticas do Agentic Space
          </h1>
          <p className="mt-2 text-slate-400">
            Métricas detalhadas e projeções de crescimento para investidores e stakeholders.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={<Users size={24} className="text-brand-400" />}
          title="Visitantes Únicos"
          value={stats.totalVisitors}
          subtitle="Total acumulado"
        />
        <KPICard
          icon={<Eye size={24} className="text-brand-400" />}
          title="Visualizações de Página"
          value={stats.totalPageViews}
          subtitle="Total acumulado"
        />
        <KPICard
          icon={<Users size={24} className="text-brand-400" />}
          title="Usuários Inscritos"
          value={stats.totalUsers}
          subtitle="Base de usuários"
        />
        <KPICard
          icon={<Bot size={24} className="text-brand-400" />}
          title="Agentes Ativos"
          value={stats.totalAgents}
          subtitle="Total de agentes"
        />
      </div>

      {/* Agent Metrics */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="text-brand-400" size={20} />
          Métricas de Agentes
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Agentes por Usuário"
            value={stats.agentsPerUser.toFixed(2)}
            description="Proporção média"
          />
          <MetricCard
            label="Média de Agentes"
            value={stats.avgAgentsPerUser.toFixed(2)}
            description="Média aritmética"
          />
          <MetricCard
            label="Mediana de Agentes"
            value={stats.medianAgentsPerUser.toFixed(2)}
            description="Valor central"
          />
        </div>
      </div>

      {/* Visit Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="text-brand-400" size={20} />
          Visitantes por Dia (Últimos 30 dias)
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.visitsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#f1f5f9' }}
                formatter={(value) => [value.toLocaleString(), 'Visitantes']}
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <Area 
                type="monotone" 
                dataKey="visitors" 
                stroke="#38bdf8" 
                fill="#38bdf8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Page Views Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="text-brand-400" size={20} />
          Visualizações por Dia (Últimos 30 dias)
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.pageViewsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#f1f5f9' }}
                formatter={(value) => [value.toLocaleString(), 'Visualizações']}
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <Bar dataKey="views" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projections */}
      {projections && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-400" size={20} />
            Projeções de Crescimento (Próximos 30 dias)
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <ProjectionCard
              label="Taxa de Crescimento"
              value={`${projections.growthRate.toFixed(2)}%`}
              description="Baseada nos últimos 7 dias"
              positive={projections.growthRate >= 0}
            />
            <ProjectionCard
              label="Visitantes Projetados"
              value={projections.projected30DayVisitors.toLocaleString()}
              description="Próximos 30 dias"
              positive={true}
            />
            <ProjectionCard
              label="Visualizações Projetadas"
              value={projections.projected30DayPageViews.toLocaleString()}
              description="Próximos 30 dias"
              positive={true}
            />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projections.visits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(value, name) => [
                    value.toLocaleString(), 
                    name === 'visitors' ? 'Visitantes' : 'Projeção'
                  ]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  dot={false}
                  name="Visitantes reais"
                />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                  data={projections.visits.filter(v => v.projected)}
                  name="Projeção"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Investment Highlights */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-brand-400" size={20} />
          Destaques para Investidores
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <HighlightCard
            title="Engajamento do Usuário"
            description={`Cada usuário cria em média ${stats.avgAgentsPerUser.toFixed(2)} agentes, demonstrando alto engajamento com a plataforma.`}
          />
          <HighlightCard
            title="Crescimento Orgânico"
            description="A plataforma está crescendo organicamente com base na criação de agentes e interações da comunidade."
          />
          <HighlightCard
            title="Ecossistema Ativo"
            description={`${stats.totalAgents} agentes ativos criados por ${stats.totalUsers} usuários, indicando um ecossistema vibrante.`}
          />
          <HighlightCard
            title="Potencial de Escala"
            description="Arquitetura preparada para escalar com aumento de usuários e agentes, mantendo performance."
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, title, value, subtitle }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm text-slate-400">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}

function MetricCard({ label, value, description }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{description}</div>
    </div>
  );
}

function ProjectionCard({ label, value, description, positive }) {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 border ${positive ? 'border-green-500/30' : 'border-red-500/30'}`}>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{description}</div>
    </div>
  );
}

function HighlightCard({ title, description }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
