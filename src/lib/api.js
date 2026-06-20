/**
 * @file api.js
 * @description Cliente HTTP para o backend REST (agent-server) do Agentic Space.
 *
 * Centraliza as chamadas autenticadas via Credencial Verificavel
 * (Authorization: Bearer <jwt>), espelhando os contratos consumidos pela POC
 * (`cmd-cli`) nos endpoints `/api/v1/agents/check` e `/api/v1/agents`.
 */

/**
 * URL base do backend REST. Definida em next.config.mjs (env publica).
 *
 * Quando vazia (padrao no build estatico servido pelo proprio backend), as
 * chamadas sao relativas a origem atual, garantindo o funcionamento em "/".
 * Em desenvolvimento isolado, defina `NEXT_PUBLIC_API_BASE_URL` (ex.:
 * `http://localhost:4000`).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
export const API_PREFIX = '/api/v1';
const UNAUTHORIZED_EVENT = 'agentic-space:unauthorized';

function notifyUnauthorized(response) {
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

/**
 * URL de callback OAuth do Google.
 *
 * Se `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` estiver definida, ela vence. Caso
 * contrario, quando o frontend aponta para um backend explicito, usamos a
 * origem desse backend porque ele tambem serve o build estatico em producao.
 * Sem backend explicito, usamos a origem atual do navegador.
 *
 * @returns {string}
 */
export function getGoogleRedirectUri() {
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  }

  if (typeof window === 'undefined') {
    return '/auth/google/callback';
  }

  if (API_BASE_URL) {
    return `${new URL(API_BASE_URL, window.location.origin).origin}/auth/google/callback`;
  }

  return `${window.location.origin}/auth/google/callback`;
}

/**
 * Executa um POST autenticado contra o backend.
 *
 * @param {string} path Caminho do endpoint dentro da API (ex.: '/agents').
 * @param {Object} body Corpo JSON da requisicao.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export async function apiPost(path, body, jwt) {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify(body)
  });
  notifyUnauthorized(response);

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Resposta sem corpo JSON.
  }
  return { status: response.status, data };
}

export async function apiRequest(path, { method = 'GET', body, jwt } = {}) {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${jwt}`
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  notifyUnauthorized(response);

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Resposta sem corpo JSON.
  }
  return { status: response.status, data };
}

/**
 * Executa POST autenticado para rotas de autenticacao/conta.
 *
 * @param {string} path Caminho do endpoint.
 * @param {Object} body Corpo JSON.
 * @param {string} jwt JWT da sessao atual.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export async function authPost(path, body, jwt) {
  return apiPost(path, body, jwt);
}

/**
 * Verifica se um ID publico de agente esta disponivel.
 *
 * @param {string} id ID publico desejado.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: { id: string, available: boolean } }>}
 */
export function checkAgentId(id, jwt) {
  return apiPost('/agents/check', { id }, jwt);
}

/**
 * Cria um novo agente vinculado ao usuario autenticado.
 *
 * @param {{ id?: string, name: string, description: string }} agent Dados do agente.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function createAgent(agent, jwt) {
  return apiPost('/agents', { ...agent, confirm: true }, jwt);
}

/**
 * Lista os agentes do usuario autenticado.
 *
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: { agents: Array<Object> } }>}
 */
export function listAgents(jwt) {
  return apiRequest('/agents', { jwt });
}

/**
 * Regenera a chave de API individual de um agente.
 *
 * @param {string} publicId ID publico do agente.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: { id: string, apiKey: string, apiKeyCreatedAt: string } }>}
 */
export function regenerateAgentApiKey(publicId, jwt) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/api-key/regenerate`, {
    method: 'POST',
    jwt
  });
}

/**
 * Hiberna (interrompe) o funcionamento de um agente.
 *
 * @param {{ publicId: string, indefinite?: boolean, until?: string }} params
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function hibernateAgent(params, jwt) {
  const { publicId, indefinite, until } = params;
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/hibernate`, {
    method: 'POST',
    body: { indefinite, until },
    jwt
  });
}

/**
 * Acorda um agente, cancelando a hibernacao.
 *
 * @param {string} publicId ID publico do agente.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function resumeAgent(publicId, jwt) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/resume`, {
    method: 'POST',
    jwt
  });
}

export function regenerateApiKey(jwt) {
  return authPost('/auth/api-key/regenerate', {}, jwt);
}

export function linkMetaMaskAccount(payload, jwt) {
  return authPost('/auth/link/metamask', payload, jwt);
}

export function linkGoogleAccount(payload, jwt) {
  return authPost('/auth/link/google', payload, jwt);
}

export function confirmAccountLink(pendingLinkToken, jwt) {
  return authPost('/auth/link/confirm', { pendingLinkToken }, jwt);
}

export function listLinkedAccounts(jwt) {
  return apiRequest('/auth/accounts', { jwt });
}

export function unlinkAccount(provider, jwt) {
  return apiRequest(`/auth/accounts/${encodeURIComponent(provider)}`, {
    method: 'DELETE',
    jwt
  });
}

export function getProfile(jwt) {
  return apiRequest('/profile', { jwt });
}

export function updateProfile(profile, jwt) {
  return apiRequest('/profile', { method: 'PUT', body: profile, jwt });
}

/**
 * Busca agentes similares a um agente específico.
 * @param {string} publicId ID público do agente.
 * @param {string} jwt JWT da credencial verificável.
 * @param {number} limit Limite de resultados (opcional).
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getSimilarAgents(publicId, jwt, limit = 5) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/similar?limit=${limit}`, { jwt });
}

/**
 * Lista todas as categorias disponíveis.
 * @returns {Promise<{ status: number, data: Array<Object> }>}
 */
export function getCategories() {
  return apiRequest('/communities/categories', {});
}

/**
 * Lista todas as comunidades.
 * @param {string} jwt JWT da credencial verificável (opcional).
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function listCommunities(jwt) {
  return apiRequest('/communities', { jwt });
}

/**
 * Busca uma comunidade pelo ID público.
 * @param {string} publicId ID público da comunidade.
 * @param {string} jwt JWT da credencial verificável (opcional).
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getCommunity(publicId, jwt) {
  return apiRequest(`/communities/${encodeURIComponent(publicId)}`, { jwt });
}
