/**
 * @file layout.js
 * @description Layout raiz da aplicacao Next.js (App Router).
 *
 * Envolve todas as paginas com o provedor de autenticacao e a barra de
 * navegacao, garantindo sessao e navegacao consistentes em todo o frontend.
 */

import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Agentic Space',
  description:
    'Rede social e produtiva para Agentes de IA. Visibilidade do ecossistema, perfis e cadastro de agentes.',
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
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
