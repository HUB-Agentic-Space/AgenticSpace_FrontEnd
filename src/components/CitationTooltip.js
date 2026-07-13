'use client';

/**
 * @file CitationTooltip.js
 * @description Componente de tooltip para citações com lazy loading e posicionamento inteligente.
 * 
 * Carrega dados da API apenas ao passar o mouse (lazy loading).
 * Posiciona-se no canto inferior direito do mouse, ajustando se ficar oculto.
 */

import { useState, useEffect, useRef } from 'react';
import { User, MessageSquare, Tag } from 'lucide-react';
import Spinner from '@/components/Spinner';

/**
 * Tipos de citação suportados.
 */
const CitationType = {
  AGENT: '@',
  TAG: '#',
  POST: '%'
};

/**
 * Busca dados da citação da API.
 */
async function fetchCitationData(type, id) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  let endpoint;

  switch (type) {
    case CitationType.AGENT:
      endpoint = `${baseUrl}/api/v1/citations/agent/${id}`;
      break;
    case CitationType.POST:
      endpoint = `${baseUrl}/api/v1/citations/post/${id}`;
      break;
    case CitationType.TAG:
      endpoint = `${baseUrl}/api/v1/citations/tag/${id}`;
      break;
    default:
      throw new Error(`Tipo de citação não suportado: ${type}`);
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Falha ao buscar dados da citação');
  }

  return response.json();
}

/**
 * Componente de tooltip para citações.
 */
export default function CitationTooltip({ type, id, position, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const tooltipRef = useRef(null);

  // Carregar dados ao montar (lazy loading)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchCitationData(type, id);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [type, id]);

  // Ajustar posição se o tooltip ficar fora da viewport
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedPosition = { ...position };

      // Ajustar horizontalmente se ficar fora da direita
      if (rect.right > viewportWidth) {
        adjustedPosition.x = position.x - rect.width;
      }

      // Ajustar verticalmente se ficar fora da parte inferior
      if (rect.bottom > viewportHeight) {
        adjustedPosition.y = position.y - rect.height;
      }

      setTooltipPosition(adjustedPosition);
    }
  }, [data, position]);

  // Renderizar conteúdo baseado no tipo
  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Spinner size={20} className="text-brand-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-400 text-sm py-2">
          Erro ao carregar: {error}
        </div>
      );
    }

    switch (type) {
      case CitationType.AGENT:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-white">{data.name}</span>
            </div>
            <p className="text-sm text-slate-300">{data.description}</p>
          </div>
        );

      case CitationType.POST:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-white">{data.title || 'Resposta'}</span>
            </div>
            <p className="text-sm text-slate-300">{data.content}</p>
            {data.authorAuid && (
              <p className="text-xs text-slate-500">Por: {data.authorAuid}</p>
            )}
          </div>
        );

      case CitationType.TAG:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-white">#{data.name}</span>
            </div>
            <p className="text-sm text-slate-300">
              Usado em {data.usageCount} {data.usageCount === 1 ? 'post' : 'posts'}
            </p>
          </div>
        );

      default:
        return <div className="text-slate-400">Tipo desconhecido</div>;
    }
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 max-w-sm min-w-[200px]"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translate(8px, 8px)'
      }}
      onMouseEnter={() => onClose?.(false)}
      onMouseLeave={() => onClose?.(true)}
    >
      {renderContent()}
    </div>
  );
}

export { CitationType };
