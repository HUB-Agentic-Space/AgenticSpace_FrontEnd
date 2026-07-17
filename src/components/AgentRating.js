'use client';

/**
 * @file AgentRating.js
 * @description Sistema de avaliação e métricas de performance para agentes.
 * Exibe estrelas (1-5), contagem de reviews e métricas mockadas (interações,
 * taxa de sucesso, tempo de resposta). UI-only com dados determinísticos.
 */

import { Star, Activity, TrendingUp, Clock } from 'lucide-react';

/**
 * Gera uma avaliação pseudo-determinística baseada no publicId do agente.
 * Garante que o mesmo agente sempre mostra as mesmas métricas.
 */
function getMockMetrics(publicId) {
  const hash = publicId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rating = (3.5 + (hash % 15) / 10).toFixed(1);
  const reviewCount = (hash % 47) + 3;
  const interactions = ((hash * 7) % 1200) + 50;
  const successRate = (85 + (hash % 14)).toFixed(0);
  const responseTime = (0.3 + (hash % 20) / 10).toFixed(1);

  return {
    rating: parseFloat(rating),
    reviewCount,
    interactions,
    successRate: parseInt(successRate),
    responseTime: parseFloat(responseTime),
  };
}

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

/**
 * @param {{ publicId: string, variant?: 'card' | 'profile' }} props
 */
export default function AgentRating({ publicId, variant = 'card' }) {
  const metrics = getMockMetrics(publicId);

  if (variant === 'card') {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Stars rating={metrics.rating} />
          <span className="font-medium text-gray-700">{metrics.rating}</span>
          <span className="text-gray-400">({metrics.reviewCount})</span>
        </div>
        <span className="flex items-center gap-1">
          <Activity size={12} /> {metrics.interactions} interações
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <Stars rating={metrics.rating} />
        <p className="mt-1 text-lg font-bold text-gray-900">{metrics.rating}</p>
        <p className="text-xs text-gray-500">{metrics.reviewCount} avaliações</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <Activity className="mx-auto mb-1 text-blue-500" size={20} />
        <p className="text-lg font-bold text-gray-900">{metrics.interactions}</p>
        <p className="text-xs text-gray-500">Interações</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <TrendingUp className="mx-auto mb-1 text-green-500" size={20} />
        <p className="text-lg font-bold text-gray-900">{metrics.successRate}%</p>
        <p className="text-xs text-gray-500">Taxa de sucesso</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <Clock className="mx-auto mb-1 text-purple-500" size={20} />
        <p className="text-lg font-bold text-gray-900">{metrics.responseTime}s</p>
        <p className="text-xs text-gray-500">Tempo de resposta</p>
      </div>
    </div>
  );
}
