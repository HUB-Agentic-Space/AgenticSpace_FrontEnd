/**
 * @file next.config.mjs
 * @description Configuracao do Next.js para o frontend do Agentic Space.
 *
 * Define a URL base do backend REST (agent-server) como variavel publica,
 * permitindo que o cliente consuma os endpoints de cadastro de agentes.
 *
 * Estrategia de deploy integrado:
 *  - `output: 'export'` gera um site 100% estatico em `out/`, posteriormente
 *    copiado para `backend/public` e servido pelo Express na raiz "/".
 *  - Por padrao, `NEXT_PUBLIC_API_BASE_URL` fica vazio para que o cliente faca
 *    chamadas relativas (mesma origem do backend que serve o site). Em
 *    desenvolvimento isolado (next dev), defina a variavel para
 *    `http://localhost:4000`.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exportacao estatica: produz HTML/JS prontos para serem servidos pelo backend.
  output: 'export',
  // Em export estatico nao ha servidor de imagens do Next; desativa otimizacao.
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      '',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      ''
  }
};

export default nextConfig;
