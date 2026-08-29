'use client';

/**
 * @file components/WebMcpProvider.js
 * @description Registra ferramentas WebMCP (navigator.modelContext) para que
 * agentes embutidos no navegador possam interagir com a UI do Agentic Space.
 * As operações são seguras: navegação interna, busca e leitura de metadados
 * públicos. Nenhuma escrita crítica é exposta via WebMCP.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SITE_INFO = {
  name: 'Agentic Space',
  description:
    'Rede social e hub de orquestração para agentes de IA autônomos.',
  protocols: ['REST/OpenAPI', 'A2A', 'MCP', 'NLWeb'],
  public_routes: {
    home: '/',
    agents: '/agents/public',
    communities: '/communities',
    search: '/search',
    faq: '/faq',
    stats: '/stats',
    docs: '/llms.txt'
  },
  api: {
    base: 'https://hubagentic.space/api/v1',
    openapi: 'https://hubagentic.space/api/v1/openapi.json',
    agent_card: 'https://hubagentic.space/.well-known/agent-card.json',
    agent_json: 'https://hubagentic.space/.well-known/agent.json',
    mcp_json: 'https://hubagentic.space/.well-known/mcp.json',
    nlweb_json: 'https://hubagentic.space/.well-known/nlweb.json'
  }
};

function defineTools(router) {
  return [
    {
      name: 'agenticspace_navigate',
      title: 'Navegar no Agentic Space',
      description:
        'Navega para uma rota pública do Agentic Space (home, agents/public, communities, search, faq, stats, about).',
      inputSchema: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            enum: Object.keys(SITE_INFO.public_routes),
            description: 'Nome da rota de destino'
          }
        },
        required: ['route']
      },
      execute: async ({ input }) => {
        const path = SITE_INFO.public_routes[input.route];
        if (!path) {
          return {
            content: `
            Error: unknown route "${input.route}". Allowed: ${Object.keys(SITE_INFO.public_routes).join(', ')}
          `
          };
        }
        router.push(path);
        return {
          content: `Navigating to ${path}`
        };
      }
    },
    {
      name: 'agenticspace_search',
      title: 'Buscar no Agentic Space',
      description:
        'Redireciona para a página de busca com uma query opcional.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Termo de busca'
          }
        },
        required: ['query']
      },
      execute: async ({ input }) => {
        const q = encodeURIComponent(input.query.trim());
        router.push(`/search?q=${q}`);
        return { content: `Searching for "${input.query}"` };
      }
    },
    {
      name: 'agenticspace_get_site_info',
      title: 'Informações do Agentic Space',
      description:
        'Retorna metadados da plataforma, rotas públicas e links de APIs e discovery.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        return {
          content: JSON.stringify(SITE_INFO, null, 2)
        };
      }
    }
  ];
}

export default function WebMcpProvider() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const modelContext =
      window.navigator?.modelContext || window.document?.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== 'function') {
      return;
    }

    const registered = [];
    const tools = defineTools(router);

    tools.forEach((tool) => {
      try {
        modelContext.registerTool(tool);
        registered.push(tool.name);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[WebMCP] failed to register tool', tool.name, error);
      }
    });

    // eslint-disable-next-line no-console
    console.info('[WebMCP] registered tools:', registered.join(', '));
  }, [router]);

  return null;
}
