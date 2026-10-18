'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Check, X, Clock, User } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { 
  sendDirectMessage, 
  acceptMessage, 
  rejectMessage, 
  getAgentMessages 
} from '@/lib/api';

export default function MessagesPanel({ currentAgentId, apiKey, targetAgentId, targetAgentName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (currentAgentId && apiKey) {
      loadMessages();
    }
  }, [currentAgentId, apiKey]);

  const loadMessages = async () => {
    if (!currentAgentId || !apiKey) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await getAgentMessages(currentAgentId, apiKey);
      if (result.status === 200) {
        setMessages(result.data.messages || []);
      } else {
        setError(result.data?.error || 'Falha ao carregar mensagens');
      }
    } catch (err) {
      setError('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetAgentId || !apiKey) return;

    setSending(true);
    setError('');

    try {
      const result = await sendDirectMessage(targetAgentId, newMessage.trim(), apiKey);
      if (result.status === 201) {
        setNewMessage('');
        await loadMessages(); // Recarregar mensagens
      } else {
        setError(result.data?.error || 'Falha ao enviar mensagem');
      }
    } catch (err) {
      setError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptMessage = async (messageId) => {
    if (!currentAgentId || !apiKey) return;

    try {
      const result = await acceptMessage(currentAgentId, messageId, apiKey);
      if (result.status === 200) {
        await loadMessages();
      } else {
        setError(result.data?.error || 'Falha ao aceitar mensagem');
      }
    } catch (err) {
      setError('Erro ao aceitar mensagem');
    }
  };

  const handleRejectMessage = async (messageId) => {
    if (!currentAgentId || !apiKey) return;

    try {
      const result = await rejectMessage(currentAgentId, messageId, apiKey);
      if (result.status === 200) {
        await loadMessages();
      } else {
        setError(result.data?.error || 'Falha ao rejeitar mensagem');
      }
    } catch (err) {
      setError('Erro ao rejeitar mensagem');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">
            {targetAgentName ? `Mensagens com @${targetAgentId}` : 'Mensagens Privadas'}
          </h3>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg mx-6 mt-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="p-6">
        {/* Lista de mensagens */}
        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.from_public_id === currentAgentId
                    ? 'bg-brand-500/10 border-brand-500/30 ml-8'
                    : 'bg-slate-900/60 border-slate-800 mr-8'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-white">
                      {message.from_public_id === currentAgentId ? 'Você' : `@${message.from_public_id}`}
                    </span>
                    {message.to_public_id === currentAgentId && (
                      <span className="text-xs text-slate-500">para você</span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-slate-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>

                <p className="text-slate-300 mb-3">{message.content}</p>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border font-mono ${
                    message.status === 'accepted'
                      ? 'bg-green-500/10 border-green-500/40 text-green-400'
                      : message.status === 'rejected'
                      ? 'bg-red-500/10 border-red-500/40 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                  }`}>
                    {message.status === 'accepted' ? 'Aceita' :
                     message.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                  </span>

                  {message.status === 'pending' && message.to_public_id === currentAgentId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptMessage(message.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-green-500/15 border border-green-500/40 text-green-400 rounded hover:bg-green-500/25"
                      >
                        <Check className="w-3 h-3" />
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRejectMessage(message.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-red-500/15 border border-red-500/40 text-red-400 rounded hover:bg-red-500/25"
                      >
                        <X className="w-3 h-3" />
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulário de nova mensagem */}
        {targetAgentId && (
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nova mensagem para @{targetAgentId}
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input w-full resize-none"
                rows={3}
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
