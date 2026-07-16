'use client';

/**
 * @file comunidade/propor-pauta/page.js
 * @description Public page for users to submit a pauta to the Governança.
 *              Didactic with clear instructions and contact info.
 */

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Send, Loader2, AlertCircle, CheckCircle, Info, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL, API_PREFIX, getStoredJwt } from '@/lib/api';

export default function ProporPautaPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!title.trim() || !description.trim()) {
      setError('Título e descrição são obrigatórios.');
      return;
    }

    const jwt = getStoredJwt();
    if (!jwt) {
      setError('Você precisa estar autenticado para propor uma pauta. Faça login primeiro.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/community/pautas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess({
          pauta: data.pauta,
          txHash: data.txHash,
          nextStep: data.next_step,
        });
        setTitle('');
        setDescription('');
      } else {
        setError(data.error || 'Falha ao enviar pauta.');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Link href="/comunidade" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> Voltar para Governança
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Propor Pauta</h1>
        <p className="mt-2 text-slate-400">
          Submeta uma pauta para a comunidade votar.
        </p>
      </div>

      {/* Didactic Instructions */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 shrink-0 text-brand-400" size={20} />
          <div className="space-y-3 text-sm text-slate-300">
            <h2 className="font-semibold text-white">Antes de propor uma pauta</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Custo:</strong> 10 CAS (1/10 do valor do registro de agente) + gas. Depositados no InfrastructureFund.</li>
              <li><strong>Pré-aprovação necessária:</strong> você precisa ter aprovado o gasto de CAS pelo contrato Diamond (ERC-20 approve).</li>
              <li><strong>Revisão:</strong> um administrador revisará sua pauta antes de incluí-la em uma votação.</li>
              <li><strong>Conteúdo:</strong> seja claro e objetivo. Descreva o problema e a solução proposta.</li>
              <li><strong>Integridade:</strong> o hash do conteúdo é registrado on-chain via Merkle tree para garantir que não haja alterações.</li>
            </ul>
            <p className="text-xs text-slate-400">
              Não sabe como aprovar o gasto de CAS? Consulte o tutorial ou entre em contato.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <a href="mailto:agenticspace@rapport.tec.br" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                <Mail size={14} /> agenticspace@rapport.tec.br
              </a>
              <a href="https://wa.me/5585985205490" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                <MessageCircle size={14} /> WhatsApp: +55 85 98520-5490
              </a>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-300">
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Pauta enviada com sucesso!</p>
              <p className="mt-1">ID: #{success.pauta?.id}</p>
              {success.txHash && (
                <p className="mt-1 text-xs">TX on-chain: {success.txHash.slice(0, 20)}...</p>
              )}
              <p className="mt-2 text-xs">{success.nextStep}</p>
              <Link href="/comunidade" className="mt-2 inline-block text-brand-400 hover:text-brand-300">
                Ver pautas →
              </Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300">
            Título da pauta *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Ex: Adicionar suporte para protocolo A2A"
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300">
            Descrição detalhada *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="Descreva o problema, a solução proposta e o impacto esperado para a comunidade..."
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            required
          />
          <p className="mt-1 text-xs text-slate-500">{description.length}/5000 caracteres</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? 'Enviando...' : 'Enviar Pauta (10 CAS)'}
        </button>
      </form>
    </div>
  );
}
