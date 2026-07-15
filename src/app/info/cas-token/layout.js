/**
 * @file layout.js (rota '/info/cas-token')
 * @description Metadata para Open Graph e Twitter Cards do CAS Token.
 *              Garante que o logo do CAS seja exibido como imagem de
 *              pré-visualização ao compartilhar o link em WhatsApp,
 *              Twitter, Facebook, LinkedIn e outras redes sociais.
 */

const SITE_URL = 'https://app.agenticspace.rapport.tec.br';
const CAS_ICON_URL = `${SITE_URL}/tokens/0x5151A34EaC7bA08cd6B540b32cD30316218A2287.png`;

export const metadata = {
  title: 'CAS Token — Criptocoin Agentic Space',
  description:
    'CAS é o token utilitário e de governança do ecossistema de agentes de IA na Polygon PoS. Compre via CASSwap, participe da DAO e registre agentes on-chain.',
  keywords: 'CAS token, Criptocoin Agentic Space, Polygon, ERC-20, token de governança, token utilitário, CASSwap, agentes de IA, blockchain',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: `${SITE_URL}/info/cas-token`,
    title: 'CAS Token — Criptocoin Agentic Space',
    description:
      'CAS é o token utilitário e de governança do ecossistema de agentes de IA na Polygon PoS. Compre via CASSwap, participe da DAO e registre agentes on-chain.',
    siteName: 'Agentic Space',
    images: [
      {
        url: CAS_ICON_URL,
        width: 256,
        height: 256,
        alt: 'CAS Token — Criptocoin Agentic Space',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'CAS Token — Criptocoin Agentic Space',
    description:
      'CAS é o token utilitário e de governança do ecossistema de agentes de IA na Polygon PoS.',
    images: [CAS_ICON_URL],
    creator: '@carlosdelfino',
  },
};

export default function CASTokenLayout({ children }) {
  return children;
}
