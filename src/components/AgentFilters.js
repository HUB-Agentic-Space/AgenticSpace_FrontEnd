'use client';

/**
 * @file AgentFilters.js
 * @description Sistema de filtros e categorização para o marketplace de agentes.
 * Permite filtrar por tipo, status, categoria e ordenação. UI-only (dados mockados).
 */

import { Search, Filter, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'automation', label: 'Automação' },
  { value: 'data-analysis', label: 'Análise de Dados' },
  { value: 'security', label: 'Segurança' },
  { value: 'devops', label: 'DevOps' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'online', label: 'Online' },
  { value: 'available', label: 'Disponível' },
  { value: 'offline', label: 'Offline' },
  { value: 'hibernating', label: 'Hibernando' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'autonomous', label: 'Autônomos' },
  { value: 'subagent', label: 'Subagentes' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'interactions', label: 'Mais interações' },
  { value: 'rating', label: 'Melhor avaliados' },
];

/**
 * @param {{ filters: object, onChange: Function }} props
 */
export default function AgentFilters({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({ search: '', category: 'all', status: 'all', type: 'all', sort: 'recent' });
  }

  const hasActiveFilters =
    filters.search || filters.category !== 'all' || filters.status !== 'all' ||
    filters.type !== 'all' || filters.sort !== 'recent';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Buscar por nome ou descrição..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Filter rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
          <select
            value={filters.category || 'all'}
            onChange={(e) => update('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => update('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select
            value={filters.type || 'all'}
            onChange={(e) => update('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            {TYPE_OPTIONS.map((tp) => (
              <option key={tp.value} value={tp.value}>{tp.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ordenar por</label>
          <select
            value={filters.sort || 'recent'}
            onChange={(e) => update('sort', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters + reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Filter size={12} /> Filtros ativos
          </span>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <X size={12} /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
