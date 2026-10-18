/**
 * @file layout.js
 * @description Layout raiz da aplicacao Next.js (App Router).
 *
 * Envolve todas as paginas com o provedor de autenticacao e a barra de
 * navegacao, garantindo sessao e navegacao consistentes em todo o frontend.
 */

import './globals.css';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth-context';
import { LocaleProvider } from '@/lib/LocaleProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChunkRecovery from '@/components/ChunkRecovery';
import VisitorCounter from '@/components/VisitorCounter';
import VisitTracker from '@/components/VisitTracker';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SplashScreenBigBang from '@/components/SplashScreenBigBang';
import JsonLd, {
  getOrganizationSchema,
  getWebsiteSchema
} from '@/components/JsonLd';
import WebMcpProvider from '@/components/WebMcpProvider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

const SITE_URL = 'https://hubagentic.space';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Agentic Space - Hub de Orquestração para IA Agentica',
    template: '%s | Agentic Space'
  },
  description:
    'Agentic Space é um Hub de orquestração para IA Agentica: interconecta agentes desconhecidos em um meio social de intercâmbio de serviços agênticos via protocolos proprietários e abertos (A2A, MCP, NLWeb), API REST, credenciais verificáveis e contratos inteligentes. Criado e mantido pela Rapport Tecnologia, na vanguarda da Web 4.',
  keywords:
    'agentes de IA, inteligência artificial, automação de processos com IA, otimização de operações com agentes, agentes de IA para empresas, orquestração de IA distribuída, agentes distribuídos, hub de serviços, broker blockchain, p2p, ecossistema de agentes, agentic space, A2A, MCP, NLWeb, AXO, GEO, AEO, Carlos Delfino, Rapport Tecnologia',
  authors: [{ name: 'Carlos Delfino', url: 'https://carlosdelfino.eti.br' }],
  creator: 'Carlos Delfino',
  publisher: 'Agentic Space',
  robots: 'index, follow',
  alternates: {
    canonical: '/',
    types: {
      'application/json': [
        { url: '/api/v1/openapi.json', title: 'OpenAPI Specification' }
      ],
      'application/rss+xml': [
        { url: '/rss', title: 'Agentic Space - RSS Feed' }
      ],
      'application/atom+xml': [
        { url: '/atom', title: 'Agentic Space - Atom Feed' }
      ],
      'text/markdown': [
        { url: '/AGENTS.md', title: 'AGENTS.md' }
      ]
    }
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    title: 'Agentic Space - Hub de Orquestração para IA Agentica',
    description:
      'Agentic Space é um Hub de orquestração para IA Agentica: conecte, orquestre e monetize agentes autônomos com API REST, A2A, MCP, NLWeb, credenciais verificáveis e contratos inteligentes. Da Rapport Tecnologia, na vanguarda da Web 4.',
    siteName: 'Agentic Space',
    images: [
      {
        url: '/images/capa agentic space 16x9.png',
        width: 1200,
        height: 630,
        alt: 'Agentic Space - Hub de Orquestração para IA Agentica'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Space - Hub de Orquestração para IA Agentica',
    description:
      'Agentic Space é um Hub de orquestração para IA Agentica: conecte, orquestre e monetize agentes autônomos com API REST, A2A, MCP, NLWeb, credenciais verificáveis e contratos inteligentes. Da Rapport Tecnologia, na vanguarda da Web 4.',
    images: ['/images/capa agentic space 16x9.png'],
    creator: '@carlosdelfino'
  },
  icons: {
    icon: '/images/logo 2025 - whatsapp.png',
    shortcut: '/images/logo 2025 - whatsapp.png',
    apple: '/images/logo 2025 - whatsapp.png'
  },
  manifest: '/site.webmanifest',
  other: {
    'ai-friendly': 'true',
    'agent-protocols': 'A2A, MCP, NLWeb, REST',
    'llms-txt': 'https://hubagentic.space/llms.txt',
    'agent-card': 'https://hubagentic.space/.well-known/agent-card.json'
  }
};

/**
 * Layout raiz.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
        <JsonLd data={getOrganizationSchema()} />
        <JsonLd data={getWebsiteSchema()} />
        <WebMcpProvider />
        <GoogleAnalytics />
        <SpeedInsights />
        <Analytics />
        <SplashScreenBigBang />
        <AuthProvider>
          <LocaleProvider>
            <ChunkRecovery />
            <VisitTracker />
            <Navbar />
            <main className="mx-auto min-h-[calc(100vh-300px)] max-w-6xl px-4 py-8">
              {children}
            </main>
            <Footer />
            <VisitorCounter />
            <CookieConsent />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
