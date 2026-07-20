'use client';

/**
 * @file comunidade/votacao/page.js
 * @description Public votação detail page within Governança — shows pauta items and allows voting.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Vote, Loader2, AlertCircle, CheckCircle, XCircle, Clock, ArrowLeft, Info, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { API_BASE_URL, API_PREFIX, getStoredJwt } from '@/lib/api';
import { useFees, formatFiat } from '@/lib/useFees';
import { useLocaleContext } from '@/lib/LocaleProvider';
import { useTranslations } from '@/lib/LocaleProvider';

const VOTACAO_STATUS = {
  active: { label: 'Ativa', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  canceled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  defeated: { label: 'Derrotada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  succeeded: { label: 'Aprovada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  queued: { label: 'Em Fila', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  executed: { label: 'Executada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  expired: { label: 'Expirada', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

function VotacaoPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const t = useTranslations();
  const { locale } = useLocaleContext();
  const { fees, loading: feesLoading } = useFees();
  const [votacao, setVotacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteLoading, setVoteLoading] = useState(null);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState(null);

  const votingFee = fees?.daoVoting;
  const votingFeeCas = votingFee?.cas ?? 50;
  const votingFeeUsd = votingFee?.usd;
  const votingFeeLocale = votingFee?.localeCurrency;
  const votingCurrencyCode = votingFee?.currencyCode || 'USD';

  const formatFeeDisplay = () => {
    const parts = [`${votingFeeCas} CAS`];
    if (votingFeeUsd != null) {
      parts.push(formatFiat(votingFeeUsd, 'USD'));
    }
    if (votingFeeLocale != null && votingCurrencyCode !== 'USD') {
      parts.push(formatFiat(votingFeeLocale, votingCurrencyCode));
    }
    return parts.join(' / ');
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/community/votacoes/${id}`);
        const data = await res.json();
        if (res.ok) {
          setVotacao(data.votacao);
        } else {
          setError(data.error || 'Failed to load votação');
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleVote(support) {
    setVoteError('');
    setVoteSuccess(null);

    const jwt = getStoredJwt();
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    setVoteLoading(support);
    try {
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/community/votacoes/${id}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ support }),
      });
      const data = await res.json();

      if (res.ok) {
        setVoteSuccess({
          support,
          txHash: data.vote?.txHash,
          nextStep: data.next_step,
        });
        const refreshRes = await fetch(`${API_BASE_URL}${API_PREFIX}/community/votacoes/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) setVotacao(refreshData.votacao);
      } else if (res.status === 401) {
        setVoteError('Você precisa estar autenticado para votar. Faça login primeiro.');
      } else {
        setVoteError(data.error || 'Falha ao registrar voto.');
      }
    } catch (err) {
      setVoteError(err.message);
    }
    setVoteLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando votação...
      </div>
    );
  }

  if (!votacao) {
    return (
      <div className="space-y-4">
        <Link href="/comunidade" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Voltar para Governança
        </Link>
        <div className="text-center">
          <Vote className="mx-auto mb-3 text-slate-600" size={40} />
          <p className="text-slate-400">{error || 'Votação não encontrada.'}</p>
        </div>
      </div>
    );
  }

  const st = VOTACAO_STATUS[votacao.status] || VOTACAO_STATUS.active;
  const isActive = votacao.status === 'active';
  const supportLabels = { 0: 'Contra', 1: 'A favor', 2: 'Abstenção' };

  return (
    <div className="space-y-6">
      <Link href="/comunidade" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> Voltar para Governança
      </Link>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Votação #{votacao.id}</h1>
            <p className="mt-2 text-xs text-slate-500">
              Merkle Root: <code className="text-slate-400">{votacao.merkle_root}</code>
            </p>
            {votacao.tx_hash && (
              <p className="mt-1 text-xs text-green-400">
                TX on-chain: {votacao.tx_hash.slice(0, 20)}...
              </p>
            )}
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${st.color}`}>
            {st.label}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <CheckCircle className="mx-auto mb-1 text-green-400" size={20} />
            <p className="text-2xl font-bold text-white">{votacao.for_votes || 0}</p>
            <p className="text-xs text-slate-400">A favor</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
            <XCircle className="mx-auto mb-1 text-red-400" size={20} />
            <p className="text-2xl font-bold text-white">{votacao.against_votes || 0}</p>
            <p className="text-xs text-slate-400">Contra</p>
          </div>
          <div className="rounded-lg border border-slate-500/30 bg-slate-500/10 p-4 text-center">
            <Clock className="mx-auto mb-1 text-slate-400" size={20} />
            <p className="text-2xl font-bold text-white">{votacao.abstain_votes || 0}</p>
            <p className="text-xs text-slate-400">Abstenção</p>
          </div>
        </div>

        {isActive && (
          <>
            <div className="mt-6 rounded-lg border border-brand-500/30 bg-brand-500/5 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 shrink-0 text-brand-400" size={16} />
                <div className="text-sm text-slate-300">
                  <p><strong>{t('comunidade.votacao.voteCost', 'Custo do voto')}:</strong> {feesLoading ? t('fees.loading', 'Carregando taxas...') : formatFeeDisplay()} + gas, depositados no InfrastructureFund.</p>
                  <p className="mt-1">{t('comunidade.votacao.approveRequired', 'Você precisa ter aprovado o gasto de CAS pelo contrato Diamond (ERC-20 approve) antes de votar.')}</p>
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

            {voteError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{voteError}</span>
              </div>
            )}

            {voteSuccess && (
              <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p>Voto registrado: {supportLabels[voteSuccess.support]}</p>
                    {voteSuccess.txHash && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_CERTIFICATE_EXPLORER_URL || 'https://polygonscan.com'}/tx/${voteSuccess.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                      >
                        TX: {voteSuccess.txHash.slice(0, 20)}...
                        <ExternalLink size={10} />
                      </a>
                    )}
                    <p className="mt-1 text-xs">{voteSuccess.nextStep}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={voteLoading !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                {voteLoading === 1 ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {t('comunidade.votacao.inFavor', 'A favor')} ({votingFeeCas} CAS)
              </button>
              <button
                onClick={() => handleVote(0)}
                disabled={voteLoading !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {voteLoading === 0 ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Contra
              </button>
              <button
                onClick={() => handleVote(2)}
                disabled={voteLoading !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
              >
                {voteLoading === 2 ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                Abstenção
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Pautas nesta Votação</h2>
        {votacao.pautas && votacao.pautas.length > 0 ? (
          <div className="space-y-3">
            {votacao.pautas.map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="font-semibold text-white">#{p.id} — {p.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Content Hash: <code className="text-slate-400">{p.content_hash?.slice(0, 30)}...</code>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-center">
            <p className="text-slate-400">Nenhuma pauta associada a esta votação.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VotacaoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando votação...
      </div>
    }>
      <VotacaoPageContent />
    </Suspense>
  );
}
