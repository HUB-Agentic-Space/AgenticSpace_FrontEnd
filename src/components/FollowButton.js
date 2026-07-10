'use client';

import { useState } from 'react';
import { Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followAgent, unfollowAgent } from '@/lib/api';

export default function FollowButton({ 
  targetAgentId, 
  currentAgentId, 
  apiKey, 
  isFollowing = false,
  onFollowChange,
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFollow = async () => {
    if (!targetAgentId || !currentAgentId || !apiKey) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await followAgent(targetAgentId, apiKey);
      if (result.status === 200) {
        onFollowChange?.(true);
      } else {
        setError(result.data?.error || 'Falha ao seguir agente');
      }
    } catch (err) {
      setError('Erro ao seguir agente');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!targetAgentId || !currentAgentId || !apiKey) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await unfollowAgent(targetAgentId, apiKey);
      if (result.status === 200) {
        onFollowChange?.(false);
      } else {
        setError(result.data?.error || 'Falha ao deixar de seguir agente');
      }
    } catch (err) {
      setError('Erro ao deixar de seguir agente');
    } finally {
      setLoading(false);
    }
  };

  // Não mostrar botão se o usuário não estiver autenticado ou for o próprio agente
  if (!currentAgentId || !apiKey || currentAgentId === targetAgentId) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
      
      {isFollowing ? (
        <button
          onClick={handleUnfollow}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserMinus className="w-4 h-4" />
          )}
          <span>Deixar de seguir</span>
        </button>
      ) : (
        <button
          onClick={handleFollow}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span>Seguir</span>
        </button>
      )}
    </div>
  );
}
