'use client';

/**
 * @file votacoes/page.js
 * @description Public voting page — lists open and closed DAO proposals with results.
 *              Uses the existing frontend auth context and i18n.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vote, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';
import { API_BASE_URL, API_PREFIX } from '@/lib/api';

const STATE_LABELS = {
  0: 'Pending',
  1: 'Active',
  2: 'Canceled',
  3: 'Defeated',
  4: 'Succeeded',
  5: 'Queued',
  6: 'Expired',
  7: 'Executed',
};

function StateBadge({ state, t }) {
  const label = STATE_LABELS[state] || 'Unknown';
  const colors = {
    0: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    2: 'bg-red-500/20 text-red-300 border-red-500/30',
    3: 'bg-red-500/20 text-red-300 border-red-500/30',
    4: 'bg-green-500/20 text-green-300 border-green-500/30',
    5: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    6: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    7: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${colors[state] || colors[0]}`}>
      {label}
    </span>
  );
}

export default function VotacoesPage() {
  const t = useTranslations();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/dao/proposals`);
        const data = await res.json();
        if (res.ok) {
          setProposals(data.proposals || []);
        } else {
          setError(data.error || 'Failed to load proposals');
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  const openProposals = proposals.filter((p) => p.state === 0 || p.state === 1);
  const closedProposals = proposals.filter((p) => p.state > 1);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          {t('votacoes.title') !== 'votacoes.title' ? t('votacoes.title') : 'DAO Voting'}
        </h1>
        <p className="mt-2 text-slate-400">
          {t('votacoes.subtitle') !== 'votacoes.subtitle' ? t('votacoes.subtitle') : 'View ongoing and closed proposals and their results.'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t('loading') !== 'loading' ? t('loading') : 'Loading...'}</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-center text-red-300">
          {error}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center">
          <Vote className="mx-auto mb-3 text-slate-600" size={40} />
          <p className="text-slate-400">
            {t('votacoes.empty') !== 'votacoes.empty' ? t('votacoes.empty') : 'No proposals available.'}
          </p>
        </div>
      ) : (
        <>
          {openProposals.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">
                {t('votacoes.open') !== 'votacoes.open' ? t('votacoes.open') : 'Open Proposals'}
              </h2>
              <div className="space-y-3">
                {openProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} t={t} />
                ))}
              </div>
            </section>
          )}

          {closedProposals.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">
                {t('votacoes.closed') !== 'votacoes.closed' ? t('votacoes.closed') : 'Closed Proposals'}
              </h2>
              <div className="space-y-3">
                {closedProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} t={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ProposalCard({ proposal, t }) {
  const forVotes = parseInt(proposal.forVotes || '0', 10);
  const againstVotes = parseInt(proposal.againstVotes || '0', 10);
  const abstainVotes = parseInt(proposal.abstainVotes || '0', 10);
  const total = forVotes + againstVotes + abstainVotes;

  return (
    <Link
      href={`/votacoes/${proposal.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-brand-500"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-white">
            {proposal.title || `Proposal #${proposal.id}`}
          </h3>
          <p className="mt-1 text-sm text-slate-400 line-clamp-2">
            {proposal.description || 'No description'}
          </p>
        </div>
        <StateBadge state={proposal.state} t={t} />
      </div>
      <div className="mt-3 flex gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-400" />
          For: {forVotes}
        </span>
        <span className="flex items-center gap-1">
          <XCircle size={14} className="text-red-400" />
          Against: {againstVotes}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          Abstain: {abstainVotes}
        </span>
        {total > 0 && (
          <span className="ml-auto">
            Total: {total}
          </span>
        )}
      </div>
    </Link>
  );
}
