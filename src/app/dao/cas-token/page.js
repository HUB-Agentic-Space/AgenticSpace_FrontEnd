'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  Shield, AlertTriangle, Gavel, Clock, CheckCircle, XCircle,
  RefreshCw, ExternalLink, Loader2, Vote, Snowflake,
  Megaphone, Lock, Unlock,
} from 'lucide-react';
import { useLocaleContext } from '@/lib/LocaleProvider';
import { useAuth } from '@/lib/auth-context';
import { DIAMOND_ADDRESS, CAS_TOKEN_ADDRESS } from '@/lib/cas-token-config';
import Link from 'next/link';

const ARBITRATION_ABI = [
  'function getCaseCount() view returns (uint256)',
  'function getCase(uint256 caseId) view returns (tuple(uint256 caseId, address filer, address[] accused, string[] reasons, bytes32 evidenceHash, uint8 freezeType, uint256 freezeUntilTime, uint256 createdAt, uint256 disclosureDeadline, uint256 votingDeadline, uint256 executedAt, uint8 state, uint8 votingPeriod, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 retryCount))',
  'function getCaseState(uint256 caseId) view returns (uint8)',
  'function getVotingPeriod(uint256 caseId) view returns (uint8)',
  'function isFrozenByArbitration(address account) view returns (bool)',
  'function isVotingLockActive() view returns (bool)',
];

const CAS_TOKEN_ABI = [
  'function isFrozen(address) view returns (bool)',
  'function freezeUntilOf(address) view returns (uint256)',
  'function isVotingLockActive() view returns (bool)',
];

const STATE_LABELS = ['Pending', 'Active', 'Executed', 'Canceled', 'Expired', 'RetryPending'];
const STATE_COLORS = ['#fcc650', '#F05F40', '#4ade80', '#eb3812', '#ce6e6d', '#cc7501'];

const PERIOD_LABELS = ['Divulgação', 'Votação', 'Resultado'];
const PERIOD_LABELS_EN = ['Disclosure', 'Voting', 'Result'];
const PERIOD_LABELS_FR = ['Divulgation', 'Vote', 'Résultat'];
const PERIOD_COLORS = ['#fcc650', '#eb3812', '#4ade80'];
const PERIOD_ICONS = [Megaphone, Lock, Unlock];

const TRANSLATIONS = {
  pt: {
    title: 'Arbitração da Moeda CAS',
    subtitle: 'Casos de arbitragem on-chain para endereços fraudulentos da moeda CAS',
    caseId: 'Caso #',
    filer: 'Proposto por',
    accused: 'Acusados',
    reason: 'Motivo',
    state: 'Estado',
    votes: 'Votos',
    for: 'A favor',
    against: 'Contra',
    abstain: 'Abstenção',
    deadline: 'Prazo',
    createdAt: 'Criado em',
    freezeType: 'Tipo de Congelamento',
    limited: 'Limitado',
    temporary: 'Temporário',
    permanent: 'Permanente',
    retryCount: 'Tentativas',
    refresh: 'Atualizar',
    loading: 'Carregando casos...',
    noCases: 'Nenhum caso de arbitragem encontrado.',
    error: 'Erro ao carregar dados on-chain',
    autoRefresh: 'Auto-atualização (30s)',
    viewOnExplorer: 'Ver no Explorer',
    frozen: 'Congelado',
    notFrozen: 'Não congelado',
    evidence: 'Evidência',
    retryPending: 'Aguardando reabertura',
    votingPeriod: 'Período',
    disclosure: 'Divulgação',
    voting: 'Votação',
    result: 'Resultado',
    disclosureDesc: 'Todos podem operar, exceto suspeitos',
    votingDesc: 'Operações suspensas para evitar compra de votos',
    resultDesc: 'Operações retomadas com decisão aplicada',
    votingLockActive: 'Bloqueio de votação ativo',
    votingLockInactive: 'Sem bloqueio de votação',
    disclosureDeadline: 'Fim da divulgação',
    votingDeadline: 'Fim da votação',
    backToDao: 'Voltar para DAO',
  },
  en: {
    title: 'CAS Token Arbitration',
    subtitle: 'On-chain arbitration cases for fraudulent CAS token addresses',
    caseId: 'Case #',
    filer: 'Filed by',
    accused: 'Accused',
    reason: 'Reason',
    state: 'State',
    votes: 'Votes',
    for: 'For',
    against: 'Against',
    abstain: 'Abstain',
    deadline: 'Deadline',
    createdAt: 'Created',
    freezeType: 'Freeze Type',
    limited: 'Limited',
    temporary: 'Temporary',
    permanent: 'Permanent',
    retryCount: 'Retries',
    refresh: 'Refresh',
    loading: 'Loading cases...',
    noCases: 'No arbitration cases found.',
    error: 'Error loading on-chain data',
    autoRefresh: 'Auto-refresh (30s)',
    viewOnExplorer: 'View on Explorer',
    frozen: 'Frozen',
    notFrozen: 'Not Frozen',
    evidence: 'Evidence',
    retryPending: 'Awaiting re-filing',
    votingPeriod: 'Period',
    disclosure: 'Disclosure',
    voting: 'Voting',
    result: 'Result',
    disclosureDesc: 'Everyone can operate, except suspects',
    votingDesc: 'Operations suspended to prevent vote buying',
    resultDesc: 'Operations resumed with decision applied',
    votingLockActive: 'Voting lock active',
    votingLockInactive: 'No voting lock',
    disclosureDeadline: 'Disclosure ends',
    votingDeadline: 'Voting ends',
    backToDao: 'Back to DAO',
  },
  fr: {
    title: 'Arbitrage du Jeton CAS',
    subtitle: 'Casos d\'arbitrage on-chain pour adresses frauduleuses du jeton CAS',
    caseId: 'Cas #',
    filer: 'Proposé par',
    accused: 'Accusés',
    reason: 'Motif',
    state: 'État',
    votes: 'Votes',
    for: 'Pour',
    against: 'Contre',
    abstain: 'Abstention',
    deadline: 'Délai',
    createdAt: 'Créé le',
    freezeType: 'Type de Gel',
    limited: 'Limité',
    temporary: 'Temporaire',
    permanent: 'Permanent',
    retryCount: 'Tentatives',
    refresh: 'Rafraîchir',
    loading: 'Chargement des cas...',
    noCases: 'Aucun cas d\'arbitrage trouvé.',
    error: 'Erreur lors du chargement des données on-chain',
    autoRefresh: 'Auto-rafraîchissement (30s)',
    viewOnExplorer: 'Voir sur Explorer',
    frozen: 'Gelé',
    notFrozen: 'Non gelé',
    evidence: 'Preuve',
    retryPending: 'En attente de réouverture',
    votingPeriod: 'Période',
    disclosure: 'Divulgation',
    voting: 'Vote',
    result: 'Résultat',
    disclosureDesc: 'Tout le monde peut opérer, sauf les suspects',
    votingDesc: 'Opérations suspendues pour éviter l\'achat de votes',
    resultDesc: 'Opérations reprises avec décision appliquée',
    votingLockActive: 'Verrouillage de vote actif',
    votingLockInactive: 'Pas de verrouillage',
    disclosureDeadline: 'Fin de divulgation',
    votingDeadline: 'Fin du vote',
    backToDao: 'Retour à la DAO',
  },
};

function formatTimestamp(ts) {
  if (!ts || ts === 0n) return '—';
  return new Date(Number(ts) * 1000).toLocaleString();
}

function shortAddress(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getPeriodLabels(locale) {
  if (locale === 'pt') return PERIOD_LABELS;
  if (locale === 'fr') return PERIOD_LABELS_FR;
  return PERIOD_LABELS_EN;
}

export default function ArbitrationPage() {
  const { locale } = useLocaleContext();
  const { address, isConnected } = useAuth();
  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;
  const periodLabels = getPeriodLabels(locale);

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [frozenStatus, setFrozenStatus] = useState({});
  const [votingLockActive, setVotingLockActive] = useState(false);
  const intervalRef = useRef(null);

  const loadCases = useCallback(async () => {
    try {
      setError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const diamond = new ethers.Contract(DIAMOND_ADDRESS, ARBITRATION_ABI, provider);
      const casToken = new ethers.Contract(CAS_TOKEN_ADDRESS, CAS_TOKEN_ABI, provider);

      let lockActive = false;
      try {
        lockActive = await diamond.isVotingLockActive();
      } catch (e) {
        try {
          lockActive = await casToken.isVotingLockActive();
        } catch (e2) {}
      }
      setVotingLockActive(lockActive);

      const caseCount = await diamond.getCaseCount();
      const count = Number(caseCount);
      const newCases = [];
      const frozenMap = {};

      for (let i = 1; i <= count; i++) {
        const arbCase = await diamond.getCase(i);
        const caseObj = {
          caseId: Number(arbCase.caseId),
          filer: arbCase.filer,
          accused: arbCase.accused,
          reasons: arbCase.reasons,
          evidenceHash: arbCase.evidenceHash,
          freezeType: Number(arbCase.freezeType),
          freezeUntilTime: arbCase.freezeUntilTime,
          createdAt: arbCase.createdAt,
          disclosureDeadline: arbCase.disclosureDeadline,
          votingDeadline: arbCase.votingDeadline,
          executedAt: arbCase.executedAt,
          state: Number(arbCase.state),
          votingPeriod: Number(arbCase.votingPeriod),
          forVotes: Number(arbCase.forVotes),
          againstVotes: Number(arbCase.againstVotes),
          abstainVotes: Number(arbCase.abstainVotes),
          retryCount: Number(arbCase.retryCount),
        };
        newCases.push(caseObj);

        for (const addr of caseObj.accused) {
          if (!frozenMap[addr]) {
            frozenMap[addr] = await casToken.isFrozen(addr);
          }
        }
      }

      newCases.sort((a, b) => b.caseId - a.caseId);
      setCases(newCases);
      setFrozenStatus(frozenMap);
      setLoading(false);
    } catch (err) {
      setError(err.message || t.error);
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadCases, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [autoRefresh, loadCases]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dao" className="text-sm mb-2 inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--color-text-muted)' }}>
              ← {t.backToDao}
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--color-primary)' }}>
              <Gavel size={32} />
              {t.title}
            </h1>
            <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              {t.autoRefresh}
            </label>
            <button
              onClick={loadCases}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-light)' }}
            >
              <RefreshCw size={16} />
              {t.refresh}
            </button>
          </div>
        </div>

        {/* Voting Lock Banner */}
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: votingLockActive ? 'rgba(235,56,18,0.12)' : 'rgba(252,198,80,0.08)',
            border: '1px solid var(--color-border)',
          }}
        >
          {votingLockActive ? (
            <>
              <Lock size={20} style={{ color: 'var(--color-primary-hover)' }} />
              <span style={{ color: 'var(--color-primary-hover)' }} className="font-semibold">
                {t.votingLockActive} — {t.votingDesc}
              </span>
            </>
          ) : (
            <>
              <Unlock size={20} style={{ color: 'var(--color-accent-gold)' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>
                {t.votingLockInactive}
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(235,56,18,0.12)', border: '1px solid var(--color-border)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--color-primary-hover)' }} />
            <span>{t.error}: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 className="animate-spin mr-2" size={24} />
            {t.loading}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
            <Shield size={48} className="mx-auto mb-4 opacity-50" />
            {t.noCases}
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((caseObj) => {
              const PeriodIconComponent = PERIOD_ICONS[caseObj.votingPeriod] || Megaphone;
              return (
              <div
                key={caseObj.caseId}
                className="rounded-xl p-6 border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-bold" style={{ color: 'var(--color-link)' }}>
                      {t.caseId}{caseObj.caseId}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: STATE_COLORS[caseObj.state] + '33',
                        color: STATE_COLORS[caseObj.state],
                      }}
                    >
                      {STATE_LABELS[caseObj.state]}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                      style={{
                        backgroundColor: PERIOD_COLORS[caseObj.votingPeriod] + '33',
                        color: PERIOD_COLORS[caseObj.votingPeriod],
                      }}
                    >
                      <PeriodIconComponent size={12} />
                      {periodLabels[caseObj.votingPeriod]}
                    </span>
                    {caseObj.retryCount > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {t.retryCount}: {caseObj.retryCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {t.createdAt}: {formatTimestamp(caseObj.createdAt)}
                  </div>
                </div>

                {/* Period description */}
                <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'var(--color-accent-deep-black)', color: 'var(--color-text-muted)' }}>
                  {caseObj.votingPeriod === 0 && t.disclosureDesc}
                  {caseObj.votingPeriod === 1 && t.votingDesc}
                  {caseObj.votingPeriod === 2 && t.resultDesc}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t.filer}</div>
                    <a
                      href={`https://polygonscan.com/address/${caseObj.filer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--color-link)' }}
                    >
                      {shortAddress(caseObj.filer)}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t.freezeType}</div>
                    <span className="flex items-center gap-1">
                      <Snowflake size={14} style={{ color: 'var(--color-accent-gold)' }} />
                      {caseObj.freezeType === 0 ? t.limited : caseObj.freezeType === 1 ? t.temporary : t.permanent}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{t.accused}</div>
                  <div className="space-y-2">
                    {caseObj.accused.map((addr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--color-accent-deep-black)' }}>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://polygonscan.com/address/${addr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                            style={{ color: 'var(--color-link)' }}
                          >
                            {shortAddress(addr)}
                            <ExternalLink size={12} />
                          </a>
                          {caseObj.reasons[idx] && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-accent-wine)' }}>
                              {caseObj.reasons[idx]}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs" style={{ color: frozenStatus[addr] ? 'var(--color-primary-hover)' : 'var(--color-text-muted)' }}>
                          {frozenStatus[addr] ? <><Snowflake size={12} /> {t.frozen}</> : t.notFrozen}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.1)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.for}</div>
                    <div className="text-lg font-bold" style={{ color: '#4ade80' }}>{caseObj.forVotes}</div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(235,56,18,0.1)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.against}</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--color-primary-hover)' }}>{caseObj.againstVotes}</div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(252,198,80,0.1)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.abstain}</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--color-accent-gold)' }}>{caseObj.abstainVotes}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Megaphone size={14} />
                    {t.disclosureDeadline}: {formatTimestamp(caseObj.disclosureDeadline)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock size={14} />
                    {t.votingDeadline}: {formatTimestamp(caseObj.votingDeadline)}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        )}
 
      </div>
    </div>
  );
}
