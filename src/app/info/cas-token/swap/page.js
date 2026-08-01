'use client';

/**
 * @file page.js (rota '/info/cas-token/swap')
 * @description Página de Swap do CAS Token. Exibe o swap nativo CASSwap
 *              (POL/CAS) inline e uma listagem de links para DEXs parceiras
 *              onde o CAS pode ser comprado/trocado na Polygon PoS.
 */

import { Coins, ExternalLink, ArrowUpDown, Info } from 'lucide-react';
import Link from 'next/link';
import CASSwapInline from '@/components/CASSwapInline';
import { useLocaleContext, useTranslations } from '@/lib/LocaleProvider';
import {
  CAS_TOKEN_ADDRESS, DIAMOND_ADDRESS, USDC_ADDRESS,
  EXPLORER_BASE, POLYGON_CHAIN_ID,
} from '@/lib/cas-token-config';

const DEX_LINKS = [
  {
    name: 'Uniswap',
    url: 'https://app.uniswap.org/explore/tokens/polygon/0x5151A34EaC7bA08cd6B540b32cD30316218A2287',
    description: 'Compre CAS na Uniswap V3 (Polygon)',
    color: '#FF007A',
  },
  {
    name: 'SushiSwap',
    url: 'https://www.sushi.com/polygon/swap?referrer=agenticspace&token1=0x5151a34eac7ba08cd6b540b32cd30316218a2287&token0=NATIVE&swapAmount=1',
    description: 'Troque POL por CAS na SushiSwap (Polygon)',
    color: '#FA52A0',
  },
  {
    name: 'KyberSwap',
    url: 'https://kyberswap.com/swap/polygon/-to-0x5151a34eac7ba08cd6b540b32cd30316218a2287?r=agenticspace',
    description: 'Melhor rota de swap via KyberSwap (Polygon)',
    color: '#31C58C',
  },
  {
    name: 'OKX',
    url: 'https://web3.okx.com/pt-br/token/polygon_pos/0x5151a34eac7ba08cd6b540b32cd30316218a2287?ref=COINGECKOREF',
    description: 'Compre e negocie CAS na OKX DEX (Polygon)',
    color: '#000000',
  },
];

export default function CASTokenSwapPage() {
  const { t } = useLocaleContext();
  const tt = useTranslations();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Coins className="text-brand-400" size={40} />
          <h1 className="text-5xl font-bold text-white">CAS Token Swap</h1>
        </div>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Compre e troque CAS na Polygon PoS. Use o swap nativo CASSwap (POL/USDC)
          ou escolha uma DEX parceira abaixo.
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

      {/* DEXs parceiras */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <ExternalLink className="text-brand-400" size={28} />
          <h2 className="text-3xl font-bold text-white">DEXs Parceiras</h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          O CAS também está disponível em principais DEXs da Polygon. Escolha uma
 plataforma abaixo para fazer swap:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {DEX_LINKS.map((dex) => (
            <a
              key={dex.name}
              href={dex.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-4 transition hover:border-brand-500/50 hover:bg-slate-800/60"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white font-bold text-lg"
                style={{ backgroundColor: dex.color }}
              >
                {dex.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {dex.name}
                  <ExternalLink size={14} className="text-slate-500" />
                </h3>
                <p className="text-sm text-slate-400 truncate">{dex.description}</p>
              </div>
            </a>
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
        </div>
      </section>
    </div>
  );
}
