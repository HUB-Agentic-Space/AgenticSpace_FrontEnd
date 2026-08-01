/**
 * @file layout.js (rota '/info/cas-token/swap')
 * @description Metadata para Open Graph e Twitter Cards da página de Swap do CAS Token.
 */

const SITE_URL = 'https://app.agenticspace.rapport.tec.br';
const CAS_ICON_URL = `${SITE_URL}/tokens/0x5151A34EaC7bA08cd6B540b32cD30316218A2287.png`;

export const metadata = {
  title: 'CAS Token Swap — Compre e Troque CAS',
  description:
    'Compre CAS via CASSwap nativo (POL/USDC) ou através de DEXs parceiras: Uniswap, SushiSwap, KyberSwap e OKX na Polygon PoS.',
  keywords: 'CAS swap, CASSwap, comprar CAS, Uniswap, SushiSwap, KyberSwap, OKX, Polygon, DEX, ERC-20',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: `${SITE_URL}/info/cas-token/swap`,
    title: 'CAS Token Swap — Compre e Troque CAS',
    description:
      'Compre CAS via CASSwap nativo (POL/USDC) ou através de DEXs parceiras na Polygon PoS.',
    siteName: 'Agentic Space',
    images: [
      {
        url: CAS_ICON_URL,
        width: 256,
        height: 256,
        alt: 'CAS Token Swap — Agentic Space',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'CAS Token Swap — Compre e Troque CAS',
    description:
      'Compre CAS via CASSwap nativo ou DEXs parceiras na Polygon PoS.',
    images: [CAS_ICON_URL],
    creator: '@carlosdelfino',
  },
};

export default function CASTokenSwapLayout({ children }) {
  return children;
}
