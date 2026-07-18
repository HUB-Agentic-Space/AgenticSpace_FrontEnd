'use client';

/**
 * @file page.js (rota '/info/cas-token')
 * @description Página institucional do CAS Token: explicação, gráficos de
 *              cotação (POL/CAS em tempo real + escalonamento por fases),
 *              e botão de compra via CASSwap usando MetaMask.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  Coins, ExternalLink, TrendingUp, BarChart3, Zap, Shield,
  ArrowUpDown, Info, Database, Layers, Wallet, FileText,
  AlertTriangle, RefreshCw, Award, BadgeCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { useLocaleContext } from '@/lib/LocaleProvider';
import { useAuth } from '@/lib/auth-context';
import { useFees, formatCas, formatFiat } from '@/lib/useFees';
import CASSwapModal from '@/components/CASSwapModal';
import AddTokenButton from '@/components/AddTokenButton';
import CASLoginGate from '@/components/CASLoginGate';
import GlossaryTooltip from '@/components/GlossaryTooltip';
import {
  CAS_TOKEN_ADDRESS, CASSWAP_ADDRESS, DIAMOND_ADDRESS,
  INFRA_FUND_ADDRESS, EXPLORER_BASE, POLYGON_CHAIN_ID,
  POLYGON_RPC, CASSWAP_READ_ABI, CAS_TOKEN_READ_ABI,
  DIAMOND_READ_ABI,
  DEFAULT_RATIO, MAX_SUPPLY, INITIAL_SUPPLY,
} from '@/lib/cas-token-config';

const COINGECKO_POL_CHART = 'https://api.coingecko.com/api/v3/coins/matic-network/market_chart?vs_currency=usd&days=1';
const COINGECKO_POL_PRICE = 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd&include_24hr_change=true';

export default function CASTokenPage() {
  const { locale, t } = useLocaleContext();
  const { session } = useAuth();
  const {
    feeList,
    ratio: onChainRatio,
    polPrice: polPriceData,
    loading: feesLoading,
    error: feesError,
    warning: feesWarning,
    refresh: refreshFees,
    swapFeeBps,
    totalSupply: onChainTotalSupply,
    maxSupply: onChainMaxSupply,
    certificatePhase,
    certificatePhaseCount,
  } = useFees();
  const [swapOpen, setSwapOpen] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [polChange24h, setPolChange24h] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const refreshTimer = useRef(null);

  const ratio = onChainRatio ?? { numerator: String(DEFAULT_RATIO.numerator), denominator: String(DEFAULT_RATIO.denominator) };
  const ratioNum = Number(ratio.numerator) / Number(ratio.denominator);
  const polPrice = polPriceData?.usd ?? null;
  const casPriceUsd = polPrice ? polPrice / ratioNum : null;
  const totalSupply = onChainTotalSupply ? Number(ethers.formatEther(onChainTotalSupply)) : null;
  const maxSupply = onChainMaxSupply ? Number(ethers.formatEther(onChainMaxSupply)) : MAX_SUPPLY;

  const fetchPriceChange = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_POL_PRICE);
      if (!res.ok) throw new Error('CoinGecko price fetch failed');
      const data = await res.json();
      const change = data['matic-network']?.usd_24h_change;
      if (change != null) {
        setPolChange24h(change);
      }
    } catch (err) {
      console.error('[cas-token] price change fetch failed:', err.message);
      setPriceError(true);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_POL_CHART);
      if (!res.ok) throw new Error('CoinGecko chart fetch failed');
      const data = await res.json();
      if (data.prices && Array.isArray(data.prices)) {
        const formatted = data.prices.map(([ts, price]) => ({
          time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          polPrice: price,
          casPrice: price / ratioNum,
        }));
        setChartData(formatted);
      }
    } catch (err) {
      console.error('[cas-token] chart fetch failed:', err.message);
    }
  }, [ratioNum]);

  useEffect(() => {
    setLoadingPrice(true);
    fetchPriceChange().finally(() => {
      setLoadingPrice(false);
    });
  }, [fetchPriceChange]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      fetchPriceChange();
      fetchChartData();
    }, 60000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchPriceChange, fetchChartData]);

  const specs = [
    { label: t('casToken.specs.name'), value: 'Agentic Space CAS Token v2.1' },
    { label: t('casToken.specs.symbol'), value: 'CAS' },
    { label: t('casToken.specs.standard'), value: 'ERC-20 (UUPS)', glossary: ['ERC-20', 'UUPS'] },
    { label: t('casToken.specs.network'), value: 'Polygon PoS (137)', glossary: ['Polygon PoS'] },
    { label: t('casToken.specs.contract'), value: CAS_TOKEN_ADDRESS, mono: true },
    { label: t('casToken.specs.decimals'), value: '18' },
    { label: t('casToken.specs.initialSupply'), value: `${INITIAL_SUPPLY.toLocaleString()} CAS` },
    { label: t('casToken.specs.maxSupply'), value: `${maxSupply.toLocaleString()} CAS` },
    { label: t('casToken.specs.swapRatio'), value: `1 POL = ${ratioNum} CAS` },
    { label: 'Swap Fee', value: `${swapFeeBps} bps (${(swapFeeBps / 100).toFixed(2)}%)`, glossary: ['Swap Fee', 'BPS'] },
    { label: 'Total Supply', value: totalSupply ? `${totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} CAS` : '—' },
  ];

  const feeLabels = {
    userRegistration: t('casToken.fees.userRegistration'),
    agentRegistration: t('casToken.fees.agentRegistration'),
    agentValidation: t('casToken.fees.agentValidation'),
    daoProposal: t('casToken.fees.daoProposal'),
    daoAgendaSubmission: t('casToken.fees.daoAgendaSubmission'),
    daoVoting: t('casToken.fees.daoVoting'),
    certificateIssuance: t('casToken.fees.certificateIssuance'),
  };

  const getFeeLabel = (fee) => feeLabels[fee.operation]
    ?? `${t('casToken.fees.unknownFee')} #${fee.feeType}`;

  const formatFeeLine = (feeObj) => {
    if (!feeObj) return '—';
    const parts = [`${formatCas(feeObj.casFormatted, locale)} CAS`];
    if (feeObj.usd != null) {
      parts.push(formatFiat(feeObj.usd, 'USD'));
    }
    if (feeObj.localeCurrency != null && feeObj.currencyCode && feeObj.currencyCode !== 'USD') {
      parts.push(formatFiat(feeObj.localeCurrency, feeObj.currencyCode));
    }
    return parts.join(' · ');
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Coins className="text-brand-400" size={40} />
          <h1 className="text-5xl font-bold text-white">{t('casToken.hero.title')}</h1>
        </div>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">{t('casToken.hero.subtitle')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="rounded-full bg-brand-600/20 px-4 py-1.5 text-sm font-medium text-brand-300 ring-1 ring-brand-500/30">
            <GlossaryTooltip term="ERC-20">ERC-20</GlossaryTooltip> · <GlossaryTooltip term="Polygon PoS">Polygon PoS</GlossaryTooltip>
          </span>
          <span className="rounded-full bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-300 ring-1 ring-slate-700">
            {t('casToken.hero.utilityToken')}
          </span>
        </div>
      </section>

      {/* O que é o CAS */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Info className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.whatIs.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>{t('casToken.whatIs.p1')}</p>
          <p>{t('casToken.whatIs.p2')}</p>
          <p>{t('casToken.whatIs.p3')}</p>
        </div>
      </section>

      {/* Especificações */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Database className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.specs.title')}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
              <span className="text-sm text-slate-400">{s.label}</span>
              <span className={`text-sm font-medium text-white ${s.mono ? 'font-mono text-xs' : ''}`}>
                {s.value}
              </span>
            </div>
          ))}
          <div className="md:col-span-2 rounded-lg bg-slate-800/30 px-4 py-2.5 text-center">
            <span className="text-xs text-slate-500">
              {t('casToken.specs.onchainNote') || 'Ratio, swap fee e total supply lidos on-chain dos contratos CASSwap e CASToken.'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href={`${EXPLORER_BASE}/token/${CAS_TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={16} /> {t('casToken.links.polygonscan')}
          </a>
          <a href="/tokens/cas-whitepaper.md" target="_blank" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={16} /> {t('casToken.links.whitepaper')}
          </a>
          <a href="/tokens/tokenomics.md" target="_blank" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={16} /> {t('casToken.links.tokenomics')}
          </a>
        </div>
      </section>

      {/* Gráfico 1: Preço POL/CAS em tempo real */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.priceChart.title')}</h2>
        </div>

        {loadingPrice ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="animate-pulse">{t('casToken.priceChart.loading')}</div>
          </div>
        ) : priceError && !polPrice ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            {t('casToken.priceChart.unavailable')}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500">{t('casToken.priceChart.polPrice')}</p>
                <p className="text-2xl font-bold text-white">
                  ${polPrice ? polPrice.toFixed(4) : '—'}
                </p>
                {polChange24h != null && (
                  <p className={`text-sm ${polChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {polChange24h >= 0 ? '▲' : '▼'} {Math.abs(polChange24h).toFixed(2)}% (24h)
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500">{t('casToken.priceChart.casPrice')}</p>
                <p className="text-2xl font-bold text-brand-400">
                  ${casPriceUsd ? casPriceUsd.toFixed(4) : '—'}
                </p>
                <p className="text-sm text-slate-400">1 POL = {ratioNum} CAS</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500">{t('casToken.priceChart.marketCap')}</p>
                <p className="text-2xl font-bold text-white">
                  ${casPriceUsd && totalSupply ? (casPriceUsd * totalSupply).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
                </p>
                <p className="text-sm text-slate-400">
                  {totalSupply ? `${totalSupply.toLocaleString()} CAS` : ''} {t('casToken.priceChart.circulating')}
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="polGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="casGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value, name) => [`$${Number(value).toFixed(4)}`, name === 'polPrice' ? 'POL' : 'CAS']}
                    />
                    <Area type="monotone" dataKey="polPrice" stroke="#38bdf8" strokeWidth={2} fill="url(#polGradient)" name="POL" />
                    <Area type="monotone" dataKey="casPrice" stroke="#a78bfa" strokeWidth={2} fill="url(#casGradient)" name="CAS" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-slate-500 text-center">
              {t('casToken.priceChart.dataSource')} · {t('casToken.priceChart.autoRefresh')}
            </p>
          </>
        )}
      </section>

      {/* Certificados Colecionáveis */}
      <section className="card space-y-6 border-2 border-brand-500/20">
        <div className="flex items-center gap-3">
          <Award className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">Certificados Colecionáveis</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            Membros do Agentic Space recebem certificados como{' '}
            <GlossaryTooltip term="NFT">NFTs</GlossaryTooltip> (<GlossaryTooltip term="ERC-721">ERC-721</GlossaryTooltip>)
            com contas vinculadas via <GlossaryTooltip term="ERC-6551">ERC-6551</GlossaryTooltip>{' '}
            (<GlossaryTooltip term="TBA">TBA</GlossaryTooltip> — Token Bound Account).
            Cada certificado é uma conta inteligente que pode custodiar{' '}
            <GlossaryTooltip term="CAS">CAS</GlossaryTooltip> e outros ativos digitais.
          </p>
          <p>
            A coleção de certificados é uma estratégia de marketing para promover o CAS
            e movimentá-lo de forma a gerar valor. Os membros poderão colecionar
            certificados ao longo das fases de evolução do site, agregando novos
            certificados ao seu <GlossaryTooltip term="TBA">TBA</GlossaryTooltip>.
          </p>
        </div>

        {certificatePhase ? (
          <div className="rounded-lg bg-slate-800/50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="text-brand-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Fase Atual: {certificatePhase.name}</h3>
              {certificatePhase.active && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/30">
                  Ativa
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div>
                <span className="text-slate-400">Depósito mínimo CAS:</span>
                <p className="font-medium text-white">
                  {Number(ethers.formatEther(certificatePhase.minCasDeposit)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} CAS
                </p>
              </div>
              <div>
                <span className="text-slate-400">Certificados emitidos:</span>
                <p className="font-medium text-white">{certificatePhase.minted}</p>
              </div>
              <div>
                <span className="text-slate-400">Total de fases:</span>
                <p className="font-medium text-white">{certificatePhaseCount}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-800/30 p-4 text-sm text-slate-400">
            {feesLoading
              ? 'Carregando fase de certificados do contrato...'
              : 'Contrato de certificados ainda não configurado ou sem fase ativa.'}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/certificado" className="btn-primary flex items-center gap-2">
            <Award size={16} /> Emitir Certificado
          </Link>
          <Link href="/certificado/verificar" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={16} /> Verificar Certificado
          </Link>
        </div>
      </section>

      {/* Como obter CAS */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Wallet className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.howToGet.title')}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-800/50 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="text-brand-400" size={20} />
              <h3 className="font-semibold text-white">{t('casToken.howToGet.casswap.title')}</h3>
            </div>
            <p className="text-sm text-slate-400">{t('casToken.howToGet.casswap.description')}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="text-brand-400" size={20} />
              <h3 className="font-semibold text-white">{t('casToken.howToGet.p2p.title')}</h3>
            </div>
            <p className="text-sm text-slate-400">{t('casToken.howToGet.p2p.description')}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="text-brand-400" size={20} />
              <h3 className="font-semibold text-white">{t('casToken.howToGet.minting.title')}</h3>
            </div>
            <p className="text-sm text-slate-400">{t('casToken.howToGet.minting.description')}</p>
          </div>
        </div>
      </section>

      {/* Tokenomics resumido */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.tokenomics.title')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-white">{t('casToken.tokenomics.supply.title')}</h3>
            <div className="rounded-lg bg-slate-800/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('casToken.tokenomics.supply.initial')}</span>
                <span className="text-white">1.000.000 CAS (10%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('casToken.tokenomics.supply.reserved')}</span>
                <span className="text-white">9.000.000 CAS (90%)</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-400">{t('casToken.tokenomics.supply.max')}</span>
                <span className="font-bold text-brand-400">{maxSupply.toLocaleString()} CAS</span>
              </div>
              {totalSupply != null && (
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-400">Total Supply (on-chain)</span>
                  <span className="font-medium text-brand-300">{totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} CAS</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="operational-fees-title" className="font-semibold text-white">
                {t('casToken.tokenomics.fees.title')}
              </h3>
              <button
                type="button"
                onClick={refreshFees}
                disabled={feesLoading}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-brand-300 transition-colors hover:bg-brand-500/10 hover:text-brand-200 disabled:cursor-wait disabled:opacity-50"
                aria-label={t('fees.refresh')}
              >
                <RefreshCw aria-hidden="true" size={14} className={feesLoading ? 'animate-spin' : ''} />
                {t('fees.refresh')}
              </button>
            </div>
            <div
              className="rounded-lg bg-slate-800/50 p-4 text-sm"
              aria-labelledby="operational-fees-title"
              aria-busy={feesLoading}
            >
              {feesLoading ? (
                <div className="flex items-center gap-2 py-4 text-slate-400" role="status" aria-live="polite">
                  <RefreshCw aria-hidden="true" size={16} className="animate-spin" />
                  <span>{t('fees.loading')}</span>
                </div>
              ) : feesError ? (
                <div className="space-y-3 rounded-md border border-red-500/30 bg-red-500/10 p-3" role="alert">
                  <div className="flex items-start gap-2 text-red-200">
                    <AlertTriangle aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t('fees.unavailable')}</p>
                      <p className="mt-1 text-xs text-red-200/80">{t('fees.unavailableHint')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={refreshFees} className="btn-secondary text-xs">
                    {t('fees.tryAgain')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {feesWarning ? (
                    <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200" role="status">
                      <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                      <span>{t('fees.partialCatalog')}</span>
                    </div>
                  ) : null}

                  {feeList?.length ? (
                    <dl className="divide-y divide-slate-700/70">
                      {feeList.map((fee) => (
                        <div key={fee.feeType} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                          <dt className="min-w-0 text-slate-400">
                            <span className="block">{getFeeLabel(fee)}</span>
                            <span className="mt-0.5 block font-mono text-[10px] text-slate-600">
                              {t('fees.onchainType')} #{fee.feeType}
                            </span>
                          </dt>
                          <dd className="shrink-0 text-right font-medium text-white">
                            {formatFeeLine(fee)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="py-3 text-slate-400" role="status">{t('fees.empty')}</p>
                  )}

                  <a
                    href={`${EXPLORER_BASE}/address/${DIAMOND_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-brand-300"
                  >
                    {t('fees.contractSource')} <ExternalLink aria-hidden="true" size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Documentos: Whitepaper + Tokenomics */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.documents.title')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/info/cas-token/whitepaper" className="card hover:border-brand-500/50 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-brand-600/20 p-3 ring-1 ring-brand-500/30">
                <FileText className="text-brand-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                  {t('casToken.documents.whitepaper.title')}
                </h3>
                <p className="text-sm text-slate-400">
                  {t('casToken.documents.whitepaper.summary')}
                </p>
                <span className="text-sm text-brand-400 group-hover:text-brand-300">
                  {t('casToken.documents.readMore')} →
                </span>
              </div>
            </div>
          </Link>
          <Link href="/info/cas-token/tokenomics" className="card hover:border-brand-500/50 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-brand-600/20 p-3 ring-1 ring-brand-500/30">
                <BarChart3 className="text-brand-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                  {t('casToken.documents.tokenomics.title')}
                </h3>
                <p className="text-sm text-slate-400">
                  {t('casToken.documents.tokenomics.summary')}
                </p>
                <span className="text-sm text-brand-400 group-hover:text-brand-300">
                  {t('casToken.documents.readMore')} →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA: Comprar CAS */}
      <section className="card space-y-6 border-2 border-brand-500/30 text-center">
        <h2 className="text-3xl font-bold text-white">{t('casToken.cta.title')}</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('casToken.cta.description')}</p>
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <button
            onClick={() => {
              if (session?.jwt) {
                setSwapOpen(true);
              } else {
                setLoginGateOpen(true);
              }
            }}
            className="btn-primary flex items-center gap-2"
          >
            <ArrowUpDown size={18} /> {t('casToken.cta.buyButton')}
          </button>
          <AddTokenButton
            address={CAS_TOKEN_ADDRESS}
            symbol="CAS"
            decimals={18}
            chainId={POLYGON_CHAIN_ID}
            image="/tokens/0x5151A34EaC7bA08cd6B540b32cD30316218A2287.png"
            label={t('casToken.cta.addToMetamask')}
          />
          <a href={`${EXPLORER_BASE}/token/${CAS_TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={16} /> {t('casToken.cta.viewExplorer')}
          </a>
        </div>
      </section>

      <CASSwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        casSwapAddress={CASSWAP_ADDRESS}
        casTokenAddress={CAS_TOKEN_ADDRESS}
        explorerUrl={EXPLORER_BASE}
        chainId={POLYGON_CHAIN_ID}
      />

      <CASLoginGate
        open={loginGateOpen}
        onClose={() => setLoginGateOpen(false)}
        onSuccess={() => {
          setLoginGateOpen(false);
          setSwapOpen(true);
        }}
      />
    </div>
  );
}
