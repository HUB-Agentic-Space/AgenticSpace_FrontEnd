'use client';

/**
 * @file agents-store.js
 * @description Cache local dos agentes criados pelo usuario.
 *
 * O backend atual (`agent-server.js`) expoe apenas a criacao e a verificacao de
 * ID de agentes; ainda nao ha endpoint de listagem. Para dar visibilidade
 * imediata no frontend (lista e perfil de agente), mantemos um cache local em
 * `localStorage`, indexado pelo DID do responsavel autenticado.
 *
 * Quando o backend disponibilizar endpoints de leitura, esta camada pode ser
 * substituida por chamadas REST sem alterar os componentes que a consomem.
 */

const STORAGE_PREFIX = 'agentic_space_agents:';

/**
 * Monta a chave de armazenamento para o usuario informado.
 * @param {string} ownerDid DID do responsavel.
 * @returns {string}
 */
function keyFor(ownerDid) {
  return `${STORAGE_PREFIX}${ownerDid || 'anon'}`;
}

/**
 * Lista os agentes em cache do usuario.
 * @param {string} ownerDid DID do responsavel.
 * @returns {Array<Object>}
 */
export function listAgents(ownerDid) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyFor(ownerDid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Adiciona (ou atualiza) um agente no cache do usuario.
 * @param {string} ownerDid DID do responsavel.
 * @param {Object} agent Dados do agente (auid, id, name, description).
 * @returns {Array<Object>} Lista atualizada.
 */
export function saveAgent(ownerDid, agent) {
  const agents = listAgents(ownerDid).filter((a) => a.id !== agent.id);
  const updated = [{ ...agent, createdAt: new Date().toISOString() }, ...agents];
  try {
    localStorage.setItem(keyFor(ownerDid), JSON.stringify(updated));
  } catch {
    // Ignora falhas de persistencia.
  }
  return updated;
}

/**
 * Busca um agente especifico pelo ID publico.
 * @param {string} ownerDid DID do responsavel.
 * @param {string} id ID publico do agente.
 * @returns {Object|null}
 */
export function getAgent(ownerDid, id) {
  return listAgents(ownerDid).find((a) => a.id === id) || null;
}
