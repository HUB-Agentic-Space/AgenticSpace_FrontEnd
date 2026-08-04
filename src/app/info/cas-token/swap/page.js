'use client';

/**
 * @file page.js (rota '/info/cas-token/swap')
 * @description Terminal de Operações do CAS Token. Exibe o swap nativo CASSwap
 *              (POL/CAS) inline, terminais de preço (GeckoTerminal, DEX Screener)
 *              e terminais de swap em DEXs parceiras onde o CAS pode ser
 *              comprado/trocado na Polygon PoS.
 */

import { ExternalLink, ArrowUpDown, Info, BarChart3, Terminal } from 'lucide-react';
import Link from 'next/link';
import CASSwapInline from '@/components/CASSwapInline';
import { useLocaleContext, useTranslations } from '@/lib/LocaleProvider';
import {
  CAS_TOKEN_ADDRESS, DIAMOND_ADDRESS, USDC_ADDRESS,
  EXPLORER_BASE, POLYGON_CHAIN_ID,
} from '@/lib/cas-token-config';

const SWAP_ADDRESS = '0x9399878Ce33EA9D4859ab708a111fB3f274BACF4';

const PRICE_TERMINALS = [
  {
    name: 'GeckoTerminal — Uniswap V3',
    url: 'https://www.geckoterminal.com/polygon_pos/pools/0x2a37bca556c39418b779901f9b2988414ee550dc',
    description: 'Preço do CAS na pool Uniswap V3 (Polygon PoS)',
    color: '#FF007A',
  },
  {
    name: 'GeckoTerminal — Quickswap',
    url: 'https://www.geckoterminal.com/polygon_pos/pools/0xf77bd26fe17adb1bc99be6cd63414b2a7819690e',
    description: 'Preço do CAS na Quickswap (Polygon PoS)',
    color: '#4181E0',
  },
  {
    name: 'GeckoTerminal — SushiSwap',
    url: 'https://www.geckoterminal.com/polygon_pos/pools/0x265d86d4d43c32037b032097e8bfb6893e1c3964',
    description: 'Preço do CAS na SushiSwap (Polygon PoS)',
    color: '#FA52A0',
  },
  {
    name: 'GeckoTerminal — ApeSwap',
    url: 'https://www.geckoterminal.com/polygon_pos/pools/0xf27f3c3e305fedf21b491a1d531fd4c3c80312b4',
    description: 'Preço do CAS na ApeSwap (Polygon)',
    color: '#FFB300',
  },
  {
    name: 'GeckoTerminal — Dfyn (WETH)',
    url: 'https://www.geckoterminal.com/polygon_pos/pools/0x2275bfc0b1e26fb36a42e26fa1e5e4d823e62bc3',
    description: 'Par WETH/CAS na Dfyn (Polygon PoS)',
    color: '#6F5DE0',
  },
  {
    name: 'DEX Screener — SushiSwap',
    url: 'https://dexscreener.com/polygon/0x265d86d4d43c32037b032097e8bfb6893e1c3964',
    description: 'Gráfico e liquidez CAS/WPOL na SushiSwap',
    color: '#1A1A2E',
  },
];

const SWAP_TERMINALS = [
  {
    name: 'Uniswap',
    url: 'https://app.uniswap.org/explore/tokens/polygon/0x5151A34EaC7bA08cd6B540b32cD30316218A2287',
    description: 'Compre CAS na Uniswap V3 (Polygon)',
    color: '#FF007A',
  },
  {
    name: 'KyberSwap',
    url: 'https://kyberswap.com/swap/polygon/-to-0x5151a34eac7ba08cd6b540b32cd30316218a2287?r=geckoterminal',
    description: 'Melhor rota de swap via KyberSwap (Polygon)',
    color: '#31C58C',
  },
  {
    name: 'SushiSwap',
    url: 'https://www.sushi.com/polygon/swap?referrer=agenticspace&token1=0x5151a34eac7ba08cd6b540b32cd30316218a2287&token0=NATIVE&swapAmount=1',
    description: 'Troque POL por CAS na SushiSwap (Polygon)',
    color: '#FA52A0',
  },
  {
    name: 'OKX',
    url: 'https://web3.okx.com/pt-br/token/polygon_pos/0x5151a34eac7ba08cd6b540b32cd30316218a2287?ref=COINGECKOREF',
    description: 'Compre e negocie CAS na OKX DEX (Polygon)',
    color: '#000000',
  },
];

function TerminalCard({ terminal }) {
  return (
    <a
      href={terminal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex items-center gap-4 transition hover:border-brand-500/50 hover:bg-slate-800/60"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white font-bold text-lg"
        style={{ backgroundColor: terminal.color }}
      >
        {terminal.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {terminal.name}
          <ExternalLink size={14} className="text-slate-500" />
        </h3>
        <p className="text-sm text-slate-400 truncate">{terminal.description}</p>
      </div>
    </a>
  );
}

export default function CASTokenSwapPage() {
  const { t } = useLocaleContext();
  const tt = useTranslations();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Terminal className="text-brand-400" size={40} />
          <h1 className="text-5xl font-bold text-white">Terminal de Operações</h1>
        </div>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Compre, venda e acompanhe o CAS na Polygon PoS. Use o swap nativo
          CASSwap (POL/USDC), consulte terminais de preço ou escolha uma DEX
          parceira abaixo.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/info/cas-token"
            className="btn-secondary flex items-center gap-2"
          >
            <Info size={16} /> {tt('navbar.casTokenInfo')}
          </Link>
        </div>
      </section>

      {/* CASSwap nativo */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">CASSwap Nativo</h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Swap direto via CASSwapUSDCPOLFacet no Diamond da Agentic Space.
          Compre CAS com POL ou USDC, ou venda CAS por POL ou USDC
          instantaneamente. Taxa e ratio definidos on-chain.
        </p>
        <CASSwapInline
          diamondAddress={DIAMOND_ADDRESS}
          casTokenAddress={CAS_TOKEN_ADDRESS}
          usdcAddress={USDC_ADDRESS}
          explorerUrl={EXPLORER_BASE}
          chainId={POLYGON_CHAIN_ID}
        />
      </section>

      {/* Terminais de Preço */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">Terminais de Preço</h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Acompanhe o preço, liquidez e volume do CAS em tempo real nas principais
          pools da Polygon PoS via GeckoTerminal e DEX Screener.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {PRICE_TERMINALS.map((terminal) => (
            <TerminalCard key={terminal.name} terminal={terminal} />
          ))}
        </div>
      </section>

      {/* Terminais de Swap */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <ExternalLink className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">Terminais de Swap</h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          O CAS também está disponível em principais DEXs da Polygon. Escolha uma
          plataforma abaixo para fazer swap:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {SWAP_TERMINALS.map((terminal) => (
            <TerminalCard key={terminal.name} terminal={terminal} />
          ))}
        </div>
      </section>

      {/* Info contrato */}
      <section className="card space-y-4">
        <div className="flex items-center gap-3">
          <Info className="text-brand-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Endereços dos Contratos</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">CAS Token</p>
            <a
              href={`${EXPLORER_BASE}/token/${CAS_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-brand-400 hover:text-brand-300 break-all"
            >
              {CAS_TOKEN_ADDRESS}
            </a>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">CASSwap (Diamond facet)</p>
            <a
              href={`${EXPLORER_BASE}/address/${DIAMOND_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-brand-400 hover:text-brand-300 break-all"
            >
              {DIAMOND_ADDRESS}
            </a>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-4 py-3 md:col-span-2">
            <p className="text-xs text-slate-500 mb-1">Swap Address (DEX)</p>
            <a
              href={`${EXPLORER_BASE}/address/${SWAP_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-brand-400 hover:text-brand-300 break-all"
            >
              {SWAP_ADDRESS}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
