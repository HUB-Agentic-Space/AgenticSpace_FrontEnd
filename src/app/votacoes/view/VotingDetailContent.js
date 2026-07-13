'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Vote,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
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

const PIE_COLORS = ['#22c55e', '#ef4444', '#64748b'];

export default function VotingDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  const id = searchParams.get('id');
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Missing proposal ID.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/dao/proposals/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProposal(data.proposal || data);
        } else {
          setError(data.error || 'Proposal not found');
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Spinner size={24} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/votacoes')} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={18} />
          Back to Voting
        </button>
        <div className="text-center">
          <Vote className="mx-auto mb-3 text-slate-600" size={40} />
          <p className="text-slate-400">{error || 'Proposal not found.'}</p>
        </div>
      </div>
    );
  }

  const forVotes = parseInt(proposal.forVotes || '0', 10);
  const againstVotes = parseInt(proposal.againstVotes || '0', 10);
  const abstainVotes = parseInt(proposal.abstainVotes || '0', 10);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  const stateLabel = STATE_LABELS[proposal.state] || 'Unknown';

  const pieData = [
    { name: 'For', value: forVotes },
    { name: 'Against', value: againstVotes },
    { name: 'Abstain', value: abstainVotes },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: 'For', votes: forVotes },
    { name: 'Against', votes: againstVotes },
    { name: 'Abstain', votes: abstainVotes },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/votacoes')}
        className="flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Voting
      </button>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {proposal.title || `Proposal #${proposal.id}`}
            </h1>
            {proposal.description && (
              <p className="mt-2 text-sm text-slate-400">{proposal.description}</p>
            )}
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border bg-brand-500/20 text-brand-300 border-brand-500/30">
            {stateLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500">Proposer</p>
            <p className="font-mono text-sm text-slate-300 truncate">
              {proposal.proposer || '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500">Start Time</p>
            <p className="text-sm text-slate-300">
              {proposal.startTime
                ? new Date(parseInt(proposal.startTime, 10) * 1000).toLocaleString()
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500">End Time</p>
            <p className="text-sm text-slate-300">
              {proposal.endTime
                ? new Date(parseInt(proposal.endTime, 10) * 1000).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 font-semibold text-white">Vote Distribution</h3>
          {totalVotes === 0 ? (
            <p className="py-8 text-center text-slate-500">No votes cast yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 font-semibold text-white">Vote Counts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="votes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="mb-4 font-semibold text-white">Summary</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="text-xs text-slate-500">For</p>
              <p className="text-lg font-semibold text-white">{forVotes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="text-red-400" size={20} />
            <div>
              <p className="text-xs text-slate-500">Against</p>
              <p className="text-lg font-semibold text-white">{againstVotes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MinusCircle className="text-slate-400" size={20} />
            <div>
              <p className="text-xs text-slate-500">Abstain</p>
              <p className="text-lg font-semibold text-white">{abstainVotes}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-400">
            Total Votes: <span className="font-semibold text-white">{totalVotes}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
