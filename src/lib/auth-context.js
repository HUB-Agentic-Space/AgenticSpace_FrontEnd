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

const AuthContext = createContext(null);

/**
 * Provedor de autenticacao. Envolve a aplicacao e disponibiliza a sessao.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Persiste e ativa uma nova sessao autenticada.
   * @param {Object} data Dados retornados pelas rotas /api/auth/*.
   */
  const login = useCallback((data) => {
    setSession(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignora falhas de persistencia (ex.: modo privado).
    }
  }, []);

  /** Encerra a sessao e limpa o armazenamento local. */
  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora.
    }
  }, []);

  const value = {
    session,
    loading,
    isAuthenticated: Boolean(session?.jwt),
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook de acesso ao contexto de autenticacao.
 * @returns {{ session: Object|null, loading: boolean, isAuthenticated: boolean, login: Function, logout: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
