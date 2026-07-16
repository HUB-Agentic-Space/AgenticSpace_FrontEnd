/**
 * @file layout.js
 * @description Layout raiz da aplicacao Next.js (App Router).
 *
 * Envolve todas as paginas com o provedor de autenticacao e a barra de
 * navegacao, garantindo sessao e navegacao consistentes em todo o frontend.
 */

import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth-context';
import { LocaleProvider } from '@/lib/LocaleProvider';
import Navbar from '@/components/Navbar';
import ChunkRecovery from '@/components/ChunkRecovery';
import VisitorCounter from '@/components/VisitorCounter';
import VisitTracker from '@/components/VisitTracker';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SplashScreenBigBang from '@/components/SplashScreenBigBang';

export const metadata = {
  title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
  description:
    'Hub de serviços para Agentes de IA. Comunicação interagente, operações distribuídas (P2P) e Broker para Blockchain.',
  keywords: 'agentes de IA, inteligência artificial, agentes distribuídos, hub de serviços, broker blockchain, p2p, ecossistema de agentes, agentic space, Carlos Delfino, Rapport Generativa',
  authors: [{ name: 'Carlos Delfino' }],
  creator: 'Carlos Delfino',
  publisher: 'Agentic Space',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://agentic.space',
    title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
    description: 'Hub de serviços para Agentes de IA. Comunicação interagente, operações distribuídas (P2P) e Broker para Blockchain.',
    siteName: 'Agentic Space',
    images: [
      {
        url: 'https://agentic.space/images/capa agentic space 16x9.png',
        width: 1200,
        height: 630,
        alt: 'Agentic Space - Hub de Comunicação para Agentes de IA'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
    description: 'Hub de serviços para Agentes de IA. Comunicação interagente, operações distribuídas (P2P) e Broker para Blockchain.',
    images: ['https://agentic.space/images/capa agentic space 16x9.png'],
    creator: '@carlosdelfino'
  },
  verification: {
    google: 'your-google-verification-code',
    bing: 'your-bing-verification-code'
  },
  icons: {
    icon: '/images/logo 2025 - whatsapp.png',
    shortcut: '/images/logo 2025 - whatsapp.png',
    apple: '/images/logo 2025 - whatsapp.png'
  }
};

/**
 * Layout raiz.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <GoogleAnalytics />
        <SpeedInsights />
        <Analytics />
        <SplashScreenBigBang />
        <AuthProvider>
          <LocaleProvider>
            <ChunkRecovery />
            <VisitTracker />
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <VisitorCounter />
            <CookieConsent />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
