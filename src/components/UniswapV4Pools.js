'use client';

/**
 * @file UniswapV4Pools.js
 * @description Seção de acompanhamento de preço do CAS na Uniswap (Polygon PoS).
 *              Busca as métricas das quatro pools Uniswap V4 na API pública do
 *              GeckoTerminal (preço USD, variação 24h, liquidez e volume) e
 *              embute o gráfico oficial de cada pool. Em caso de falha da API,
 *              os cards continuam exibindo gráfico e links — apenas as
 *              estatísticas mostram '—'.
 */

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, TrendingUp, Droplets, Activity } from 'lucide-react';
import { CAS_TOKEN_ADDRESS } from '@/lib/cas-token-config';

const UNISWAP_TOKEN_URL = `https://app.uniswap.org/explore/tokens/polygon/${CAS_TOKEN_ADDRESS}`;
const GECKO_POOL_BASE = 'https://www.geckoterminal.com/polygon_pos/pools';
const GECKO_API_BASE = 'https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools';
const REFRESH_MS = 60_000;

/**
 * Pools Uniswap V4 do CAS na Polygon PoS, criadas em 2026-11-09 (fee 0.3%).
 * O identificador da pool no Uniswap V4 é o poolId (bytes32), que é o mesmo
 * valor usado pelo GeckoTerminal na URL e na API.
 */
const UNISWAP_V4_POOLS = [
  {
    id: '0xe92c05c0729dc356b7dd4e2114ace9ff39ed3cb73b150c32a705ce5c8a63ef1f',
    pair: 'CAS / USDT',
    quoteSymbol: 'USDT',
    quoteAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    fee: '0.3%',
  },
  {
    id: '0xf7b92470206a71c0fc1086e5d2776724cbaa5e283dc99c1a2312dc44d9e755d3',
    pair: 'CAS / WETH',
    quoteSymbol: 'WETH',
    quoteAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    fee: '0.3%',
  },
  {
    id: '0xe734da5beaea37909294fc34be04f7a677265ec9795ee8a399ae9bdff3aa637d',
    pair: 'CAS / WPOL',
    quoteSymbol: 'WPOL',
    quoteAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    fee: '0.3%',
  },
  {
    id: '0x184f2790d70b20af6130f87e22ef832693ff589148310b5482a0e749b9c3a76f',
    pair: 'CAS / USDC',
    quoteSymbol: 'USDC',
    quoteAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    fee: '0.3%',
  },
];

const geckoPoolUrl = (id) => `${GECKO_POOL_BASE}/${id}`;
const geckoEmbedUrl = (id) =>
  `${GECKO_POOL_BASE}/${id}?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=1h`;
const uniswapSwapUrl = (quoteAddress) =>
  `https://app.uniswap.org/swap?chain=polygon&inputCurrency=${quoteAddress}&outputCurrency=${CAS_TOKEN_ADDRESS}`;

function formatUsdPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '$0';
  return `$${n < 1 ? n.toPrecision(4) : n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatUsdAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n >= 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(2)}%`;
}

function PoolCard({ pool, data }) {
  const attrs = data?.attributes;
  const change24h = attrs ? formatChange(attrs.price_change_percentage?.h24) : null;
  const txns24h = attrs?.transactions?.h24;
  const txCount = txns24h ? (txns24h.buys ?? 0) + (txns24h.sells ?? 0) : null;

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-white">{pool.pair}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FF007A]/15 px-3 py-1 text-xs font-medium text-[#FF9BC8] ring-1 ring-[#FF007A]/30">
            Uniswap V4
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
            fee {pool.fee}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Preço CAS</p>
          <p className="text-sm font-semibold text-brand-400">
            {formatUsdPrice(attrs?.base_token_price_usd)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Variação 24h</p>
          <p className={`text-sm font-semibold ${
            change24h == null ? 'text-slate-400'
              : Number(attrs.price_change_percentage?.h24) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change24h ?? '—'}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Liquidez</p>
          <p className="text-sm font-semibold text-white">{formatUsdAmount(attrs?.reserve_in_usd)}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Volume 24h{txCount != null ? ` (${txCount} tx)` : ''}</p>
          <p className="text-sm font-semibold text-white">{formatUsdAmount(attrs?.volume_usd?.h24)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800">
        <iframe
          title={`Gráfico GeckoTerminal ${pool.pair} (Uniswap V4)`}
          src={geckoEmbedUrl(pool.id)}
          className="h-[420px] w-full"
          loading="lazy"
          allow="clipboard-write"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-slate-500 break-all">poolId {pool.id}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={geckoPoolUrl(pool.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <ExternalLink size={12} /> GeckoTerminal
          </a>
          <a
            href={uniswapSwapUrl(pool.quoteAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            <ExternalLink size={12} /> Negociar {pool.quoteSymbol} → CAS
          </a>
        </div>
      </div>
    </div>
  );
}

export default function UniswapV4Pools() {
  const [poolsData, setPoolsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPools = useCallback(async () => {
    try {
      const ids = UNISWAP_V4_POOLS.map((p) => p.id).join(',');
      const res = await fetch(`${GECKO_API_BASE}/multi/${ids}`);
      if (!res.ok) throw new Error(`GeckoTerminal API ${res.status}`);
      const json = await res.json();
      const byAddress = {};
      for (const pool of json.data ?? []) {
        const address = pool.attributes?.address?.toLowerCase();
        if (address) byAddress[address] = pool;
      }
      setPoolsData(byAddress);
      setError(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[uniswap-v4-pools] fetch failed:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
    const timer = setInterval(fetchPools, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchPools]);

  const pools = UNISWAP_V4_POOLS.map((p) => ({ ...p, data: poolsData[p.id.toLowerCase()] }));
  const prices = pools
    .map((p) => Number(p.data?.attributes?.base_token_price_usd))
    .filter(Number.isFinite);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const totalLiquidity = pools.reduce(
    (sum, p) => sum + (Number(p.data?.attributes?.reserve_in_usd) || 0), 0,
  );
  const totalVolume24h = pools.reduce(
    (sum, p) => sum + (Number(p.data?.attributes?.volume_usd?.h24) || 0), 0,
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-brand-400" size={28} />
        <h2 className="text-3xl font-bold text-white">Acompanhamento na Uniswap</h2>
      </div>
      <p className="text-slate-400 max-w-2xl">
        Preço do CAS em tempo real nas pools <strong className="text-slate-300">Uniswap V4</strong>{' '}
        da Polygon PoS — CAS/USDT, CAS/WETH, CAS/WPOL e CAS/USDC — com gráficos e métricas do
        GeckoTerminal, atualizados a cada minuto.
      </p>

      {/* Resumo agregado + link da página do token na Uniswap */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplets className="text-[#FF9BC8]" size={20} />
            <h3 className="text-lg font-bold text-white">CAS na Uniswap (Polygon)</h3>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                atualizado {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              type="button"
              onClick={fetchPools}
              className="btn-secondary flex items-center gap-1.5 text-xs"
              aria-label="Atualizar métricas das pools"
            >
              <RefreshCw size={12} /> Atualizar
            </button>
            <a
              href={UNISWAP_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              <ExternalLink size={12} /> Ver na Uniswap
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            Métricas indisponíveis no momento — os gráficos e links abaixo seguem funcionais.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500">Preço médio CAS</p>
            <p className="text-xl font-bold text-brand-400">
              {loading ? '…' : formatUsdPrice(avgPrice)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500">Liquidez total (V4)</p>
            <p className="text-xl font-bold text-white">
              {loading ? '…' : formatUsdAmount(totalLiquidity)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500">Volume 24h (V4)</p>
            <p className="text-xl font-bold text-white">{formatUsdAmount(totalVolume24h)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500">Pools V4 ativas</p>
            <p className="text-xl font-bold text-white">{UNISWAP_V4_POOLS.length}</p>
          </div>
        </div>
      </div>

      {/* Cards por pool */}
      <div className="grid gap-6">
        {pools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} data={pool.data} />
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
        <Activity size={12} /> Dados e gráficos por GeckoTerminal · pools identificadas pelo poolId
        do Uniswap V4 · atualização automática a cada 60s
      </p>
    </section>
  );
}
