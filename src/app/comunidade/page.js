'use client';

/**
 * @file comunidade/page.js
 * @description Public Community DAO page — lists pautas and votações with voting interface.
 *              Didactic page with instructions and contact info for doubts.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Vote, CheckCircle, XCircle, Clock, Info, Mail, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL, API_PREFIX, getStoredJwt } from '@/lib/api';

const PAUTA_STATUS = {
  pending: { label: 'Em Análise', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  approved: { label: 'Aprovada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected: { label: 'Rejeitada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  in_votacao: { label: 'Em Votação', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
};

const VOTACAO_STATUS = {
  active: { label: 'Ativa', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  canceled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  defeated: { label: 'Derrotada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  succeeded: { label: 'Aprovada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  queued: { label: 'Em Fila', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  executed: { label: 'Executada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  expired: { label: 'Expirada', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function ComunidadePage() {
  const [tab, setTab] = useState('pautas');
  const [pautas, setPautas] = useState([]);
  const [votacoes, setVotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [pRes, vRes] = await Promise.all([
          fetch(`${API_BASE_URL}${API_PREFIX}/community/pautas`),
          fetch(`${API_BASE_URL}${API_PREFIX}/community/votacoes`),
        ]);
        const pData = await pRes.json();
        const vData = await vRes.json();
        if (pRes.ok) setPautas(pData.pautas || []);
        if (vRes.ok) setVotacoes(vData.votacoes || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Community DAO</h1>
        <p className="mt-2 text-slate-400">
          Participe da governança da comunidade — proponha pautas e vote nas votações.
        </p>
      </div>

      {/* Didactic Info Box */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 shrink-0 text-brand-400" size={20} />
          <div className="space-y-3 text-sm text-slate-300">
            <h2 className="font-semibold text-white">Como funciona o Community DAO?</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li><strong>Proponha uma pauta:</strong> descreva uma ideia ou mudança para a comunidade. Custo: 10 CAS (1/10 do registro de agente).</li>
              <li><strong>Aprovação do admin:</strong> um administrador revisa e aprova ou rejeita sua pauta.</li>
              <li><strong>Votação:</strong> pautas aprovadas são agrupadas em votações com verificação Merkle tree on-chain.</li>
              <li><strong>Voto:</strong> vote a favor, contra ou abstenção. Custo: 50 CAS (1/2 do registro de agente).</li>
              <li><strong>Resultado:</strong> ao final da votação, o resultado é registrado on-chain com transparência total.</li>
            </ol>
            <p className="text-xs text-slate-400">
              Todas as taxas são depositadas no InfrastructureFund para sustentar a infraestrutura da plataforma.
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

      <div className="flex justify-center">
        <Link href="/comunidade/propor-pauta" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-500">
          <FileText size={18} />
          Propor Pauta
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-2 border-b border-slate-700">
            <button
              onClick={() => setTab('pautas')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === 'pautas' ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={16} className="inline mr-1" /> Pautas ({pautas.length})
            </button>
            <button
              onClick={() => setTab('votacoes')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === 'votacoes' ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Vote size={16} className="inline mr-1" /> Votações ({votacoes.length})
            </button>
          </div>

          {tab === 'pautas' ? (
            pautas.length === 0 ? (
              <div className="text-center">
                <FileText className="mx-auto mb-3 text-slate-600" size={40} />
                <p className="text-slate-400">Nenhuma pauta proposta ainda.</p>
                <p className="text-sm text-slate-500 mt-1">Seja o primeiro a propor uma pauta!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pautas.map(p => {
                  const st = PAUTA_STATUS[p.status] || PAUTA_STATUS.pending;
                  return (
                    <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">#{p.id} — {p.title}</h3>
                          <p className="mt-1 text-sm text-slate-400 line-clamp-3">{p.description}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      {p.rejection_reason && (
                        <p className="mt-2 text-xs text-red-400">Motivo da rejeição: {p.rejection_reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            votacoes.length === 0 ? (
              <div className="text-center">
                <Vote className="mx-auto mb-3 text-slate-600" size={40} />
                <p className="text-slate-400">Nenhuma votação disponível.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {votacoes.map(v => {
                  const st = VOTACAO_STATUS[v.status] || VOTACAO_STATUS.active;
                  return (
                    <Link
                      key={v.id}
                      href={`/comunidade/votacao?id=${v.id}`}
                      className="block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-brand-500"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">Votação #{v.id}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Merkle Root: {v.merkle_root?.slice(0, 20)}...
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-400" />
                          A favor: {v.for_votes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle size={14} className="text-red-400" />
                          Contra: {v.against_votes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Abstenção: {v.abstain_votes || 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
