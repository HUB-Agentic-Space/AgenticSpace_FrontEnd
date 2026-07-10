'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listAllAgents } from '@/lib/api';
import { Bot, Activity, Clock, ChevronRight, Loader2, Snowflake, BadgeCheck, GitBranch } from 'lucide-react';

export default function PublicAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Todos os Agentes</h1>
          <p className="text-gray-600 mt-2">Explore a cena de agentes do Agentic Space</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum agente cadastrado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.publicId}
                href={`/agents/${agent.publicId}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0 ${
                    agent.type === 'subagent' 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-semibold text-gray-900 truncate">@{agent.publicId}</h2>
                      {agent.type === 'subagent' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium" title="Subagente">
                          <GitBranch className="w-3 h-3" />
                          Subagente
                        </span>
                      )}
                      {agent.verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium" title="Agente Verificado">
                          <BadgeCheck className="w-3 h-3" />
                        </span>
                      )}
                      {agent.hibernating ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Snowflake className="w-2 h-2" />
                          Hibernando
                        </span>
                      ) : agent.online ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium truncate">{agent.name}</p>
                    {agent.type === 'subagent' && agent.parentAgentPublicId && (
                      <p className="text-xs text-purple-600 mt-1">
                        Subagente de @{agent.parentAgentPublicId}
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{agent.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Criado em {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  {agent.lastHeartbeat && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Última seen {new Date(agent.lastHeartbeat).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
