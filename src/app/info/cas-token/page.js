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
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { useTranslations } from '@/lib/LocaleProvider';
import { useAuth } from '@/lib/auth-context';
import CASSwapModal from '@/components/CASSwapModal';
import AddTokenButton from '@/components/AddTokenButton';
import CASLoginGate from '@/components/CASLoginGate';
import {
  CAS_TOKEN_ADDRESS, CASSWAP_ADDRESS, DIAMOND_ADDRESS,
  INFRA_FUND_ADDRESS, EXPLORER_BASE, POLYGON_CHAIN_ID,
  POLYGON_RPC, CASSWAP_READ_ABI, CAS_TOKEN_READ_ABI,
  DIAMOND_READ_ABI,
  DEFAULT_RATIO, MAX_SUPPLY, INITIAL_SUPPLY,
  PRICE_PHASES, DEFAULT_OPERATIONAL_FEES,
} from '@/lib/cas-token-config';

const COINGECKO_POL_CHART = 'https://api.coingecko.com/api/v3/coins/matic-network/market_chart?vs_currency=usd&days=1';
const COINGECKO_POL_PRICE = 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd&include_24hr_change=true';

export default function CASTokenPage() {
  const t = useTranslations();
  const { session } = useAuth();
  const [swapOpen, setSwapOpen] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [polPrice, setPolPrice] = useState(null);
  const [polChange24h, setPolChange24h] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [totalSupply, setTotalSupply] = useState(null);
  const [operationalFees, setOperationalFees] = useState(DEFAULT_OPERATIONAL_FEES);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const refreshTimer = useRef(null);

  const ratioNum = Number(ratio.numerator) / Number(ratio.denominator);
  const casPriceUsd = polPrice ? polPrice / ratioNum : null;

  const fetchOnChainData = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      const swap = new ethers.Contract(CASSWAP_ADDRESS, CASSWAP_READ_ABI, provider);
      const [num, den] = await swap.getRatio();
      setRatio({ numerator: num.toString(), denominator: den.toString() });

      const cas = new ethers.Contract(CAS_TOKEN_ADDRESS, CAS_TOKEN_READ_ABI, provider);
      const supply = await cas.totalSupply();
      setTotalSupply(Number(ethers.formatEther(supply)));

      const diamond = new ethers.Contract(DIAMOND_ADDRESS, DIAMOND_READ_ABI, provider);
      const fees = await diamond.getFees();
      const feesInCas = DEFAULT_OPERATIONAL_FEES.map((f) => ({
        ...f,
        fee: Number(ethers.formatEther(fees[f.contractField])),
      }));
      setOperationalFees(feesInCas);
      console.info('[cas-token] fees loaded from Diamond:', feesInCas);
    } catch (err) {
      console.error('[cas-token] on-chain fetch failed:', err.message);
    }
  }, []);

  const fetchPriceData = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_POL_PRICE);
      if (!res.ok) throw new Error('CoinGecko price fetch failed');
      const data = await res.json();
      const price = data['matic-network']?.usd;
      const change = data['matic-network']?.usd_24h_change;
      if (price) {
        setPolPrice(price);
        setPolChange24h(change);
      }
    } catch (err) {
      console.error('[cas-token] price fetch failed:', err.message);
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
    Promise.all([fetchOnChainData(), fetchPriceData()]).finally(() => {
      setLoadingPrice(false);
    });
  }, [fetchOnChainData, fetchPriceData]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      fetchPriceData();
      fetchChartData();
    }, 60000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchPriceData, fetchChartData]);

  const specs = [
    { label: t('casToken.specs.name'), value: 'Agentic Space CAS Token v2.1' },
    { label: t('casToken.specs.symbol'), value: 'CAS' },
    { label: t('casToken.specs.standard'), value: 'ERC-20 (UUPS)' },
    { label: t('casToken.specs.network'), value: 'Polygon PoS (137)' },
    { label: t('casToken.specs.contract'), value: CAS_TOKEN_ADDRESS, mono: true },
    { label: t('casToken.specs.decimals'), value: '18' },
    { label: t('casToken.specs.initialSupply'), value: `${INITIAL_SUPPLY.toLocaleString()} CAS` },
    { label: t('casToken.specs.maxSupply'), value: `${MAX_SUPPLY.toLocaleString()} CAS` },
    { label: t('casToken.specs.swapRatio'), value: `1 POL = ${ratioNum} CAS` },
  ];

  const feeLabels = {
    userRegistration: t('casToken.fees.userRegistration'),
    agentRegistration: t('casToken.fees.agentRegistration'),
    agentValidation: t('casToken.fees.agentValidation'),
    daoProposal: t('casToken.fees.daoProposal'),
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
            ERC-20 · Polygon PoS
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

      {/* Gráfico 2: Escalonamento por fases */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">{t('casToken.phases.title')}</h2>
        </div>
        <p className="text-slate-400">{t('casToken.phases.description')}</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PRICE_PHASES}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="phase" tickFormatter={(v) => `P${v}`} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value) => [`${value} POL`, t('casToken.phases.casPrice')]}
                labelFormatter={(v) => `${t('casToken.phases.phase')} ${v}`}
              />
              <Bar dataKey="casPricePol" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-3 py-2 text-left">{t('casToken.phases.phase')}</th>
                <th className="px-3 py-2 text-left">{t('casToken.phases.users')}</th>
                <th className="px-3 py-2 text-left">{t('casToken.phases.agents')}</th>
                <th className="px-3 py-2 text-right">{t('casToken.phases.casPrice')}</th>
                <th className="px-3 py-2 text-right">USD</th>
                <th className="px-3 py-2 text-right">{t('casToken.phases.marketCap')}</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_PHASES.map((p) => (
                <tr key={p.phase} className="border-b border-slate-800 text-slate-300">
                  <td className="px-3 py-2 font-medium text-white">P{p.phase}</td>
                  <td className="px-3 py-2">{p.users}</td>
                  <td className="px-3 py-2">{p.agents}</td>
                  <td className="px-3 py-2 text-right">{p.casPricePol} POL</td>
                  <td className="px-3 py-2 text-right">${p.usdApprox}</td>
                  <td className="px-3 py-2 text-right">${p.marketCap.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <span className="font-bold text-brand-400">10.000.000 CAS</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-white">{t('casToken.tokenomics.fees.title')}</h3>
            <div className="rounded-lg bg-slate-800/50 p-4 space-y-2 text-sm">
              {operationalFees.map((f, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-slate-400">{feeLabels[f.operation]}</span>
                  <span className="text-white">{f.fee} CAS</span>
                </div>
              ))}
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
