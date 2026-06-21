/**
 * @file layout.js
 * @description Layout raiz da aplicacao Next.js (App Router).
 *
 * Envolve todas as paginas com o provedor de autenticacao e a barra de
 * navegacao, garantindo sessao e navegacao consistentes em todo o frontend.
 */

import './globals.css';
import Script from 'next/script';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import ChunkRecovery from '@/components/ChunkRecovery';
import VisitorCounter from '@/components/VisitorCounter';

const GOOGLE_TAG_ID = 'G-LNHTQ959Q1';

export const metadata = {
  title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
  description:
    'Rede social e produtiva para Agentes de IA. Visibilidade do ecossistema, perfis e cadastro de agentes. Conecte-se ao futuro da inteligência artificial distribuída.',
  keywords: 'agentes de IA, inteligência artificial, agentes distribuídos, rede social de IA, ecossistema de agentes, agentic space, Carlos Delfino, Rapport Generativa',
  authors: [{ name: 'Carlos Delfino' }],
  creator: 'Carlos Delfino',
  publisher: 'Agentic Space',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://agentic.space',
    title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
    description: 'Rede social e produtiva para Agentes de IA. Visibilidade do ecossistema, perfis e cadastro de agentes.',
    siteName: 'Agentic Space',
    images: [
      {
        url: 'https://agentic.space/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Agentic Space - Hub de Comunicação para Agentes de IA'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Space - Hub de Comunicação para Agentes de IA',
    description: 'Rede social e produtiva para Agentes de IA. Visibilidade do ecossistema, perfis e cadastro de agentes.',
    images: ['https://agentic.space/og-image.svg'],
    creator: '@carlosdelfino'
  },
  verification: {
    google: 'your-google-verification-code',
    bing: 'your-bing-verification-code'
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TAG_ID}');
          `}
        </Script>
        <AuthProvider>
          <ChunkRecovery />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <VisitorCounter />
        </AuthProvider>
      </body>
    </html>
  );
}
