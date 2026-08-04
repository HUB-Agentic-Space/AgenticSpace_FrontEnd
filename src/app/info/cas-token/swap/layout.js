/**
 * @file layout.js (rota '/info/cas-token/swap')
 * @description Metadata para Open Graph e Twitter Cards da página de Swap do CAS Token.
 */

const SITE_URL = 'https://app.agenticspace.rapport.tec.br';
const CAS_ICON_URL = `${SITE_URL}/tokens/0x5151A34EaC7bA08cd6B540b32cD30316218A2287.png`;

export const metadata = {
  title: 'Terminal de Operações — CAS Token',
  description:
    'Terminal de Operações do CAS Token: CASSwap nativo (POL/USDC), terminais de preço (GeckoTerminal, DEX Screener) e DEXs parceiras (Uniswap, Quickswap, SushiSwap, ApeSwap, Dfyn, KyberSwap) na Polygon PoS.',
  keywords: 'CAS swap, CASSwap, terminal de operações, comprar CAS, Uniswap, Quickswap, SushiSwap, ApeSwap, Dfyn, KyberSwap, GeckoTerminal, DEX Screener, Polygon, DEX, ERC-20',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: `${SITE_URL}/info/cas-token/swap`,
    title: 'Terminal de Operações — CAS Token',
    description:
      'Compre e negocie CAS via CASSwap nativo, terminais de preço e DEXs parceiras na Polygon PoS.',
    siteName: 'Agentic Space',
    images: [
      {
        url: CAS_ICON_URL,
        width: 256,
        height: 256,
        alt: 'Terminal de Operações — CAS Token — Agentic Space',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Terminal de Operações — CAS Token',
    description:
      'Compre e negocie CAS via CASSwap nativo, terminais de preço e DEXs parceiras na Polygon PoS.',
    images: [CAS_ICON_URL],
    creator: '@carlosdelfino',
  },
};

export default function CASTokenSwapLayout({ children }) {
  return children;
}
