'use client';

/**
 * @file auth-context.js
 * @description Contexto de autenticacao do frontend do Agentic Space.
 *
 * Mantem, no cliente, a sessao do usuario apos o login (Google/MetaMask):
 *  - `jwt`: Credencial Verificavel assinada (Bearer token para o backend).
 *  - `apiKey`: chave de API gerada com a mesma validade do VC.
 *  - `subject`: dados do sujeito autenticado (DID, provider, conta, etc.).
 *
 * A sessao e persistida em `localStorage` para sobreviver a recarregamentos.
 * Nao armazenamos segredos do emissor no cliente; apenas o JWT/credencial do
 * proprio usuario, que tambem e enviado ao backend nas chamadas autenticadas.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/** Chave usada para persistir a sessao em localStorage. */
const STORAGE_KEY = 'agentic_space_session';
const LOCAL_SESSION_KEYS = ['agentic_space_session', 'agentic_space_link_google'];
const ADMIN_API_PATH = '/api/v1/admin/me';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ADMIN_ROLES = ['superadmin', 'admin', 'moderator'];

const AuthContext = createContext(null);

/**
 * Provedor de autenticacao. Envolve a aplicacao e disponibiliza a sessao.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = useCallback(async (jwt) => {
    if (!jwt) return false;
    try {
      const res = await fetch(`${API_BASE_URL}${ADMIN_API_PATH}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const admin = ADMIN_ROLES.includes(data.role);
        setIsAdmin(admin);
        return admin;
      }
    } catch {
      // ignore
    }
    setIsAdmin(false);
    return false;
  }, []);

  // Hidrata a sessao a partir do localStorage no primeiro render do cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const exp = parsed?.expirationDate;
        const valid = !exp || Date.now() < new Date(exp).getTime();
        if (parsed?.jwt && valid) {
          setSession(parsed);
          checkAdminRole(parsed.jwt).finally(() => setLoading(false));
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Persiste e ativa uma nova sessao autenticada.
   * @param {Object} data Dados retornados pelas rotas /api/v1/auth/*.
   */
  const login = useCallback((data) => {
    setSession(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignora falhas de persistencia (ex.: modo privado).
    }
    if (data?.jwt) {
      checkAdminRole(data.jwt);
    }
  }, [checkAdminRole]);

  /**
   * Atualiza parcialmente a sessao atual e persiste o novo valor.
   * @param {Object|Function} patch Campos a mesclar ou updater.
   */
  const updateSession = useCallback((patch) => {
    setSession((current) => {
      const next =
        typeof patch === 'function'
          ? patch(current)
          : { ...(current || {}), ...(patch || {}) };
      try {
        if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignora falhas de persistencia.
      }
      return next;
    });
  }, []);

  /** Encerra a sessao e limpa o armazenamento local. */
  const logout = useCallback(() => {
    setSession(null);
    setIsAdmin(false);
    clearLocalSessionState();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('agentic-space:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('agentic-space:unauthorized', handleUnauthorized);
  }, [logout]);

  const value = {
    session,
    loading,
    isAuthenticated: Boolean(session?.jwt),
    isAdmin,
    login,
    updateSession,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function clearLocalSessionState() {
  try {
    for (const key of LOCAL_SESSION_KEYS) {
      localStorage.removeItem(key);
    }
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('agentic_space_session:')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignora.
  }

  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('agentic_space_')) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignora.
  }

  clearClientCookies();
}

function clearClientCookies() {
  if (typeof document === 'undefined') return;

  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter(Boolean);
  if (cookieNames.length === 0) return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');
  const domains = new Set(['', hostname]);
  for (let index = 0; index < domainParts.length - 1; index += 1) {
    domains.add(`.${domainParts.slice(index).join('.')}`);
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const paths = new Set(['/']);
  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `/${part}`;
    paths.add(currentPath);
  }

  for (const name of cookieNames) {
    for (const path of paths) {
      for (const domain of domains) {
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; SameSite=Lax`;
      }
    }
  }
}

/**
 * Hook de acesso ao contexto de autenticacao.
 * @returns {{ session: Object|null, loading: boolean, isAuthenticated: boolean, isAdmin: boolean, login: Function, updateSession: Function, logout: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
