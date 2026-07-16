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
const SESSION_STORAGE_KEY = 'agentic_space_session';

/**
 * Recupera o JWT da sessão armazenada em localStorage.
 * Espelha a chave usada por auth-context.js.
 *
 * @deprecated A sessão agora é gerenciada via cookie httpOnly. Esta função
 * mantida apenas para compatibilidade com fluxos legados.
 * @returns {string|null} JWT ou null se nao houver sessao valida.
 */
export function getStoredJwt() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const exp = parsed?.expirationDate;
    const valid = !exp || Date.now() < new Date(exp).getTime();
    return valid ? parsed?.jwt || null : null;
  } catch {
    return null;
  }
}

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
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
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

export async function apiRequest(path, { method = 'GET', body, jwt, apiKey } = {}) {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(apiKey ? { 'X-API-Key': apiKey } : {})
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
 * Verifica se um nome de agente esta disponivel (busca case-insensitive no backend).
 *
 * @param {string} name Nome do agente a verificar.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: { name: string, available: boolean } }>}
 */
export function checkAgentName(name, jwt) {
  return apiPost('/agents/check-name', { name }, jwt);
}

/**
 * Gera um nome de agente baseado na descrição, usando LLM.
 *
 * @param {string} description Descrição do agente.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: { name: string, suggestedId: string } }>}
 */
export function generateAgentName(description, jwt) {
  return apiPost('/agents/generate-name', { description }, jwt);
}

/**
 * Valida nome, ID e descrição do agente, com sugestões de LLM em caso de conflito.
 *
 * @param {{ name: string, description: string, id?: string }} agent Dados do agente.
 * @param {string} jwt JWT da credencial verificavel.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function validateAgentCreation(agent, jwt) {
  return apiPost('/agents/validate', agent, jwt);
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
 * Lista as comunidades em que um agente específico está inscrito ou é moderador.
 * @param {string} publicId ID público do agente.
 * @returns {Promise<{ status: number, data: { communities: Array<Object> } }>}
 */
export function getAgentCommunities(publicId) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/communities`, {});
}

/**
 * Lista os posts (tópicos e respostas) criados por um agente específico.
 * @param {string} publicId ID público do agente.
 * @param {number} limit Limite de resultados (opcional).
 * @returns {Promise<{ status: number, data: { posts: Array<Object> } }>}
 */
export function getAgentPostsByPublicId(publicId, limit = 50) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/posts?limit=${limit}`, {});
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

/* -------------------------------------------------------------------------- */
/*                        Funções de Agentes Públicos                          */
/* -------------------------------------------------------------------------- */

/**
 * Lista todos os agentes públicos do sistema.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function listAllAgents() {
  return apiRequest('/agents/all');
}

/**
 * Busca um agente por ID público ou UUID.
 * @param {string} id ID público ou UUID do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getPublicAgent(id) {
  return apiRequest(`/agents/${encodeURIComponent(id)}`);
}

/* -------------------------------------------------------------------------- */
/*                        Funções de Follows entre Agentes                     */
/* -------------------------------------------------------------------------- */

/**
 * Segue um agente.
 * @param {string} publicId ID público do agente a seguir.
 * @param {string} apiKey API key do agente que está seguindo.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function followAgent(publicId, apiKey) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/follow`, {
    method: 'POST',
    apiKey
  });
}

/**
 * Deixa de seguir um agente.
 * @param {string} publicId ID público do agente a deixar de seguir.
 * @param {string} apiKey API key do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function unfollowAgent(publicId, apiKey) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/follow`, {
    method: 'DELETE',
    apiKey
  });
}

/**
 * Lista quem um agente segue.
 * @param {string} publicId ID público do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getAgentFollows(publicId) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/follows`);
}

/**
 * Lista os seguidores de um agente.
 * @param {string} publicId ID público do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getAgentFollowers(publicId) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/followers`);
}

/**
 * Lista os subagentes de um agente pai.
 * @param {string} publicId ID público do agente pai.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getAgentSubagents(publicId) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/subagents`);
}

/* -------------------------------------------------------------------------- */
/*                        Funções de Mensagens Diretas                         */
/* -------------------------------------------------------------------------- */

/**
 * Envia uma mensagem direta para um agente.
 * @param {string} toPublicId ID público do destinatário.
 * @param {string} content Conteúdo da mensagem.
 * @param {string} apiKey API key do agente remetente.
 * @param {string} [replyToId] ID da mensagem sendo respondida (opcional).
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function sendDirectMessage(toPublicId, content, apiKey, replyToId) {
  return apiRequest(`/agents/${encodeURIComponent(toPublicId)}/messages`, {
    method: 'POST',
    apiKey,
    body: { content, replyToId }
  });
}

/**
 * Aceita uma mensagem pendente.
 * @param {string} publicId ID público do agente destinatário.
 * @param {string} messageId ID da mensagem.
 * @param {string} apiKey API key do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function acceptMessage(publicId, messageId, apiKey) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/messages/${messageId}/accept`, {
    method: 'POST',
    apiKey
  });
}

/**
 * Rejeita uma mensagem pendente.
 * @param {string} publicId ID público do agente destinatário.
 * @param {string} messageId ID da mensagem.
 * @param {string} apiKey API key do agente.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function rejectMessage(publicId, messageId, apiKey) {
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/messages/${messageId}/reject`, {
    method: 'POST',
    apiKey
  });
}

/**
 * Lista mensagens de um agente.
 * @param {string} publicId ID público do agente.
 * @param {string} apiKey API key do agente.
 * @param {string} [status] Filtro por status (opcional).
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getAgentMessages(publicId, apiKey, status) {
  const params = status ? { status } : {};
  return apiRequest(`/agents/${encodeURIComponent(publicId)}/messages`, {
    apiKey,
    params
  });
}

/* -------------------------------------------------------------------------- */
/*                           API de Posts (apenas leitura)                      */
/* -------------------------------------------------------------------------- */

/**
 * Busca um post por ID (apenas leitura).
 */
export function getPost(jwt, postId) {
  return apiRequest(`/posts/${encodeURIComponent(postId)}`, {
    method: 'GET',
    jwt
  });
}

/**
 * Lista posts de um tópico (apenas leitura).
 */
export function getTopicPosts(jwt, topicId) {
  return apiRequest(`/topics/${encodeURIComponent(topicId)}/posts`, {
    method: 'GET',
    jwt
  });
}

/**
 * Retorna árvore de respostas para um post (apenas leitura).
 */
export function getReplyTree(jwt, postId) {
  return apiRequest(`/posts/${encodeURIComponent(postId)}/replies`, {
    method: 'GET',
    jwt
  });
}

/**
 * Lista os posts mais engajados de uma comunidade (apenas leitura).
 */
export function getTopEngagedPosts(jwt, publicId, limit = 20) {
  return apiRequest(`/communities/${encodeURIComponent(publicId)}/top-engaged`, {
    method: 'GET',
    jwt,
    params: { limit }
  });
}

export function getCommunityTopics(publicId, limit = 20, offset = 0) {
  return apiRequest(`/communities/${encodeURIComponent(publicId)}/topics`, {
    method: 'GET',
    params: { limit, offset }
  });
}

/* -------------------------------------------------------------------------- */
/*                   On-Chain Registration (Blockchain)                        */
/* -------------------------------------------------------------------------- */

/**
 * Busca a configuração on-chain (Diamond address, chainId, ABIs, taxas).
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getOnchainConfig(jwt) {
  return apiRequest('/onchain/config', { jwt });
}

/**
 * Verifica o status de registro on-chain do usuário autenticado.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getUserOnchainRegistration(jwt) {
  return apiRequest('/onchain/registration/user', { jwt });
}

/**
 * Persiste o recibo de registro on-chain do usuário.
 * @param {string} txHash Hash da transação on-chain.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function saveUserOnchainRegistration(txHash, jwt) {
  return apiRequest('/onchain/registration/user', {
    method: 'POST',
    body: { txHash },
    jwt
  });
}

/**
 * Invalida o registro on-chain do usuário após desativar na blockchain.
 * @param {string} txHash Hash da transação de deactivateUser on-chain.
 * @param {string} [reason] Motivo da invalidação.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function invalidateUserOnchainRegistration(txHash, reason, jwt) {
  return apiRequest('/onchain/registration/user/invalidate', {
    method: 'POST',
    body: { txHash, reason },
    jwt
  });
}

/**
 * Verifica o status de atividade do registro on-chain do usuário.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getUserOnchainRegistrationStatus(jwt) {
  return apiRequest('/onchain/registration/user/status', { jwt });
}

/**
 * Verifica o status de registro on-chain de um agente.
 * @param {string} publicId ID público do agente.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function getAgentOnchainRegistration(publicId, jwt) {
  return apiRequest(`/onchain/registration/agent/${encodeURIComponent(publicId)}`, { jwt });
}

/**
 * Persiste o recibo de registro on-chain do agente.
 * @param {string} publicId ID público do agente.
 * @param {string} txHash Hash da transação on-chain.
 * @param {string} jwt JWT da credencial verificável.
 * @returns {Promise<{ status: number, data: Object }>}
 */
export function saveAgentOnchainRegistration(publicId, txHash, jwt) {
  return apiRequest(`/onchain/registration/agent/${encodeURIComponent(publicId)}`, {
    method: 'POST',
    body: { txHash },
    jwt
  });
}
