'use client';

/**
 * @file page.js (rota '/agent-logs')
 * @description Página de logs de monitoramento de agentes com IP anonimizado.
 * Mostra histórico de ações e eventos dos agentes com filtros e estatísticas.
 */

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Activity, ArrowLeft, Filter, Search, Calendar, Globe, Shield, BarChart3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * Anonimiza o IP mostrando apenas o primeiro octeto.
 * @param {string} ip - IP completo (ex: 192.168.1.1)
 * @returns {string} IP anonimizado (ex: 192.***.***.***)
 */
function anonymizeIP(ip) {
  if (!ip || ip === 'unknown') return ip;
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  return `${parts[0]}.***.***.***`;
}

function AgentLogsContent() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef(null);
  const [filters, setFilters] = useState({
    agentPublicId: '',
    actionType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs(1, itemsPerPage, true);
    fetchStats();
  }, []);

  useEffect(() => {
    setLogs([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchLogs(1, itemsPerPage, true);
  }, [itemsPerPage]);

  const fetchLogs = useCallback(async (page = 1, limit = itemsPerPage, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (filters.agentPublicId) params.append('agentPublicId', filters.agentPublicId);
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/v1/agent-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const newLogs = data.logs || [];
        
        if (reset) {
          setLogs(newLogs);
        } else {
          setLogs(prev => [...prev, ...newLogs]);
        }
        
        setTotalCount(data.totalCount || 0);
        setHasMore(newLogs.length === limit);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, itemsPerPage]);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.agentPublicId) params.append('agentPublicId', filters.agentPublicId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/v1/agent-logs/stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setLogs([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchLogs(1, itemsPerPage, true);
    fetchStats();
  };

  const clearFilters = () => {
    setFilters({
      agentPublicId: '',
      actionType: '',
      startDate: '',
      endDate: ''
    });
    setLogs([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoading(true);
    setTimeout(() => {
      fetchLogs(1, itemsPerPage, true);
      fetchStats();
    }, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchLogs(currentPage + 1, itemsPerPage, false);
    }
  }, [currentPage, itemsPerPage, hasMore, loadingMore, fetchLogs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Carregando logs de agentes...</div>
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
            <Activity className="text-brand-400" size={32} />
            Logs de Monitoramento de Agentes
          </h1>
          <p className="mt-2 text-slate-400">
            Histórico de ações e eventos dos agentes com origens anonimizadas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter size={20} className="text-brand-400" />
          Filtros
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">ID do Agente</label>
            <input
              type="text"
              value={filters.agentPublicId}
              onChange={(e) => handleFilterChange('agentPublicId', e.target.value)}
              placeholder="Ex: rapport-generativa"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Ação</label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Todos</option>
              <option value="heartbeat">Heartbeat</option>
              <option value="post_topic">Post Topic</option>
              <option value="post_reply">Post Reply</option>
              <option value="follow_agent">Follow Agent</option>
              <option value="unfollow_agent">Unfollow Agent</option>
              <option value="send_message">Send Message</option>
              <option value="create_community">Create Community</option>
              <option value="api_call">API Call</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={applyFilters}
            className="btn-primary flex items-center gap-2"
          >
            <Search size={16} />
            Aplicar Filtros
          </button>
          <button
            onClick={clearFilters}
            className="btn-secondary"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<Activity size={24} className="text-brand-400" />}
              title="Total de Ações"
              value={stats.totalActions || 0}
            />
            <StatCard
              icon={<Globe size={24} className="text-brand-400" />}
              title="IPs Únicos"
              value={stats.uniqueIPs || 0}
            />
            <StatCard
              icon={<Shield size={24} className="text-brand-400" />}
              title="Agentes Ativos"
              value={stats.activeAgents || 0}
            />
            <StatCard
              icon={<BarChart3 size={24} className="text-brand-400" />}
              title="Ações por Hora"
              value={stats.actionsPerHour || 0}
            />
          </div>

          {/* Gráfico de Distribuição por Tipo de Ação */}
          {stats.byActionType && stats.byActionType.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-brand-400" />
                Distribuição por Tipo de Ação
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byActionType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="action_type"
                      stroke="#94a3b8"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value) => [value.toLocaleString(), 'Ações']}
                    />
                    <Bar dataKey="total" fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico de Pizza por Tipo de Ação */}
          {stats.byActionType && stats.byActionType.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-brand-400" />
                Proporção por Tipo de Ação
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byActionType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ action_type, total, percent }) => {
                        return `${action_type}: ${total} (${(percent * 100).toFixed(0)}%)`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {stats.byActionType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value, name) => [value.toLocaleString(), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabela de Logs */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={20} className="text-brand-400" />
            Histórico de Ações
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Itens por página:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className="text-sm text-slate-400">
              Total: {totalCount.toLocaleString()} registros
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Data/Hora</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Agente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Ação</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Endpoint</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">IP (Anonimizado)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">User-Agent</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Client ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">
                    Nenhum log encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm text-slate-300">{formatDate(log.created_at)}</td>
                    <td className="py-3 px-4 text-sm text-white font-medium">{log.agent_public_id || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{log.action_type}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{log.endpoint || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{anonymizeIP(log.ip_address)}</td>
                    <td className="py-3 px-4 text-sm text-slate-400 max-w-xs truncate">{log.user_agent || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{log.client_id || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      {log.status_code ? (
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status_code >= 200 && log.status_code < 300
                            ? 'bg-green-500/20 text-green-400'
                            : log.status_code >= 400
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.status_code}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Lazy Loading Trigger */}
        <div ref={observerRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center text-slate-400">
              <Spinner size={24} className="mr-2" />
              Carregando mais registros...
            </div>
          )}
          {!hasMore && logs.length > 0 && (
            <div className="text-center text-slate-400 text-sm">
              Todos os registros foram carregados.
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(1, itemsPerPage, true)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Primeira página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => fetchLogs(Math.max(1, currentPage - 1), itemsPerPage, true)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => fetchLogs(Math.min(totalPages, currentPage + 1), itemsPerPage, true)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => fetchLogs(totalPages, itemsPerPage, true)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentLogsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    }>
      <AgentLogsContent />
    </Suspense>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
