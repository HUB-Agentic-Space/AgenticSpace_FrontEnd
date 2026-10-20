'use client';

/**
 * @file OnrampPanel.js
 * @description Painel de onramp fiat → cripto usando o Onramp Kit da Circle
 *              (@circle-fin/onramp-kit), conforme o guia
 *              https://www.arc.io/blog/add-usdc-funding-to-your-app-without-building-an-onramp-from-scratch
 *              e a documentação do App Kit (docs.arc.io/app-kit/onramp).
 *
 *              Fluxo: (1) o backend cunha uma sessão curta via
 *              POST /api/v1/onramp/sessions; (2) este componente monta o
 *              widget hospedado (iframe) com `onramp.mountIframe`; (3) os
 *              eventos de ciclo de vida dirigem o status exibido. O usuário
 *              escolhe o token (USDC/EURC — os únicos entregues pelo onramp)
 *              e a rede de destino (Arc, Polygon e demais do catálogo).
 *
 *              BRLA não é vendido pelo provedor: para obtê-lo, o usuário
 *              compra USDC aqui e faz swap USDC → BRLA no CASSwap.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { createOnrampKit, fetchOnrampSession } from '@circle-fin/onramp-kit';
import { useWallet } from '@/lib/wallet/useWallet';
import { API_BASE_URL, API_PREFIX } from '@/lib/api';

const SESSIONS_URL = `${API_BASE_URL}${API_PREFIX}/onramp/sessions`;
const CONFIG_URL = `${API_BASE_URL}${API_PREFIX}/onramp/config`;

/**
 * Labels de exibição para os identificadores de rede aceitos pelo widget.
 * Identificadores desconhecidos caem no próprio valor (o backend mantém a
 * whitelist; o catálogo efetivo pertence ao provedor do widget).
 */
const CHAIN_LABELS = {
  Arc: 'Arc',
  Arc_Testnet: 'Arc (testnet)',
  Polygon: 'Polygon PoS',
  Polygon_Amoy_Testnet: 'Polygon Amoy (testnet)',
  Ethereum: 'Ethereum',
  Base: 'Base',
  Arbitrum: 'Arbitrum',
  Optimism: 'OP Mainnet',
  Avalanche: 'Avalanche',
  Solana: 'Solana',
  Unichain: 'Unichain',
  Sonic: 'Sonic',
  Sei: 'Sei',
};

const PHASE_LABEL = {
  minting: 'Criando sessão segura…',
  loading: 'Carregando widget do onramp…',
  ready: 'Widget carregado — conclua o pagamento no quadro abaixo.',
  submitted: 'Depósito enviado — aguardando liquidação on-chain.',
  settled: 'Depósito liquidado! Os tokens foram enviados para a sua carteira.',
};

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

/**
 * Painel de onramp fiat (USDC/EURC) embutido via iframe do Onramp Kit.
 *
 * @returns {JSX.Element}
 */
export default function OnrampPanel() {
  const [config, setConfig] = useState(null); // GET /onramp/config
  const [configError, setConfigError] = useState(null); // contrato {code,error,next_step}
  const [token, setToken] = useState('USDC');
  const [chain, setChain] = useState('Polygon');
  const [phase, setPhase] = useState('idle'); // idle|minting|loading|ready|submitted|settled|notCompleted|error
  const [error, setError] = useState(null); // { code, message, details, nextStep }
  const [widgetUrl, setWidgetUrl] = useState(null);
  const [session, setSession] = useState(null);

  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const kitRef = useRef(null);
  const kitBaseUrlRef = useRef(null);

  const {
    account,
    isConnecting,
    connect,
    disconnect,
  } = useWallet();

  // ---------------------------------------------------------------- config
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(CONFIG_URL, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw { code: data.code || `HTTP_${res.status}`, message: data.error || 'Falha ao consultar a configuração do onramp.', nextStep: data.next_step || null };
        }
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) {
          setConfigError(err?.message ? err : { message: 'Onramp indisponível no momento.', nextStep: 'Tente novamente em instantes.' });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------- widget
  const closeWidget = useCallback(() => {
    try { widgetRef.current?.close(); } catch { /* já fechado */ }
    widgetRef.current = null;
  }, []);

  useEffect(() => () => closeWidget(), [closeWidget]);

  const getKit = useCallback(() => {
    const widgetBaseUrl = config?.widgetBaseUrl;
    if (!kitRef.current || kitBaseUrlRef.current !== widgetBaseUrl) {
      kitRef.current = createOnrampKit(widgetBaseUrl ? { widgetBaseUrl } : undefined);
      kitBaseUrlRef.current = widgetBaseUrl;
    }
    return kitRef.current;
  }, [config]);

  /**
   * Cunha a sessão no backend usando fetchOnrampSession (SDK), com um fetch
   * wrapper que captura o corpo de erro do nosso contrato
   * { error, code, details, next_step } para exibição fiel ao api.md.
   */
  const mintSession = useCallback(async () => {
    const captured = { error: null };
    const wrappingFetch = async (input, init) => {
      const response = await fetch(input, init);
      if (!response.ok) {
        try {
          captured.error = await response.clone().json();
        } catch { /* corpo não-JSON: mantém null */ }
      }
      return response;
    };

    try {
      return await fetchOnrampSession({
        url: SESSIONS_URL,
        credentials: 'include',
        fetch: wrappingFetch,
        body: {
          // O backend deriva o appUserId real (VC quando logada, anon:<wallet>
          // quando anônima) — este placeholder só atende o schema do request.
          appUserId: 'web',
          destinationAddress: account,
          destinationChain: chain,
          assets: { tokens: [token] },
          metadata: { source: 'cas-token-swap' },
        },
      });
    } catch (err) {
      const api = captured.error;
      throw {
        code: api?.code || err?.name || 'ONRAMP_SESSION_FAILED',
        message: api?.error || err?.message || 'Não foi possível iniciar a sessão de onramp.',
        details: api?.details || null,
        nextStep: api?.next_step || null,
      };
    }
  }, [account, chain, token]);

  /** Monta o widget iframe na sessão corrente. */
  useEffect(() => {
    if (!session || !containerRef.current) return;
    setPhase('loading');
    try {
      closeWidget();
      widgetRef.current = getKit().mountIframe({
        session,
        container: containerRef.current,
        loadTimeout: 20_000,
        onInitializationSuccess: () => setPhase('ready'),
        onInitializationError: (envelope) => {
          const code = envelope?.code || envelope?.payload?.code;
          if (code === 'INVALID_SESSION_TOKEN') {
            // Sessão rejeitada/expirada: recunha e remonta.
            setSession(null);
            mintAndMount();
            return;
          }
          setPhase('error');
          setError({
            code: code || 'INIT_ERROR',
            message: 'O widget do onramp não conseguiu iniciar.',
            nextStep: 'Recarregue a página ou tente abrir o onramp em uma nova aba pelo link abaixo.',
          });
        },
        onSessionExpired: () => {
          // Sessão expirou com o widget aberto: recunha e remonta.
          setSession(null);
          mintAndMount();
        },
        onDepositSubmitted: () => setPhase('submitted'),
        onDepositSettled: () => setPhase('settled'),
        onDepositNotCompleted: (envelope) => {
          const code = envelope?.code || envelope?.payload?.code || 'NOT_COMPLETED';
          setPhase('notCompleted');
          setError({
            code,
            message: 'O fluxo de compra terminou sem depósito concluído.',
            nextStep: 'Você pode tentar novamente, escolher outro método de pagamento ou voltar mais tarde.',
          });
        },
      });
    } catch (err) {
      setPhase('error');
      setError({
        code: err?.name || 'MOUNT_FAILED',
        message: err?.message || 'Falha ao montar o widget do onramp.',
        nextStep: 'Verifique a conexão e tente novamente.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const mintAndMount = useCallback(async () => {
    setError(null);
    setPhase('minting');
    try {
      const fresh = await mintSession();
      setWidgetUrl(fresh?.widgetUrl || null);
      setSession(fresh);
    } catch (err) {
      setPhase('error');
      setError(err?.code ? err : {
        code: 'ONRAMP_SESSION_FAILED',
        message: err?.message || 'Falha ao criar a sessão de onramp.',
        nextStep: 'Tente novamente em instantes.',
      });
    }
  }, [mintSession]);

  const handleStart = useCallback(async () => {
    if (!account) {
      try { await connect(); } catch { /* erro já tratado pelo hook */ }
      return;
    }
    await mintAndMount();
  }, [account, connect, mintAndMount]);

  const handleClose = useCallback(() => {
    closeWidget();
    setSession(null);
    setWidgetUrl(null);
    setPhase('idle');
    setError(null);
  }, [closeWidget]);

  // ---------------------------------------------------------------- render
  const tokens = config?.supportedTokens?.length ? config.supportedTokens : ['USDC', 'EURC'];
  const chains = config?.allowedChains?.length ? config.allowedChains : Object.keys(CHAIN_LABELS);
  const busy = phase === 'minting' || phase === 'loading' || isConnecting;
  const widgetVisible = Boolean(session);

  return (
    <div className="card w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="text-brand-400" size={20} />
          Onramp Fiat — Circle
        </h2>
        {config?.sandbox && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 ring-1 ring-amber-500/30">
            Sandbox
          </span>
        )}
      </div>

      <p className="text-sm text-slate-400">
        Compre <strong className="text-slate-300">USDC</strong> ou{' '}
        <strong className="text-slate-300">EURC</strong> com cartão de débito,
        Apple Pay, Google Pay ou transferência — recebendo direto na sua
        carteira na rede escolhida (Polygon, Arc e demais redes do catálogo).
        Depois, troque por CAS ou BRLA no CASSwap acima.
      </p>

      {/* Estado de configuração */}
      {configError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            [{configError.code || 'ONRAMP_CONFIG'}] {configError.message}
            {configError.nextStep && <> — Próximo passo: {configError.nextStep}</>}
          </span>
        </div>
      )}

      {config && !config.enabled && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-300">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            O onramp está desabilitado neste ambiente (ONRAMP_API_KEY não
            configurada no backend). Você ainda pode adquirir USDC/BRLA/CAS nas
            DEXs parceiras abaixo.
          </span>
        </div>
      )}

      {config?.enabled && (
        <>
          {/* Seletores de ativo e rede */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Você recebe (token)</label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input w-full"
                disabled={busy}
              >
                {tokens.map((tk) => (
                  <option key={tk} value={tk}>{tk}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rede de destino</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="input w-full"
                disabled={busy}
              >
                {chains.map((c) => (
                  <option key={c} value={c}>{CHAIN_LABELS[c] || c}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong className="text-slate-400">BRLA</strong> não é vendido pelo
              onramp da Circle. Para obter BRLA: compre USDC aqui e faça swap
              USDC → BRLA no CASSwap acima. A verificação de identidade (KYC)
              acontece dentro do widget hospedado pela Circle.
            </span>
          </p>

          {/* Carteira de destino */}
          {!account ? (
            <button
              onClick={handleStart}
              disabled={busy}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              Conectar carteira para receber
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
              <span>Destino: <span className="font-mono text-slate-300">{shorten(account)}</span></span>
              <button type="button" onClick={disconnect} className="text-brand-400 hover:text-brand-300">
                trocar carteira
              </button>
            </div>
          )}

          {/* Ação principal */}
          {account && !widgetVisible && (
            <button
              onClick={handleStart}
              disabled={busy}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {phase === 'minting' ? 'Criando sessão…' : 'Comprar com moeda fiduciária'}
            </button>
          )}

          {/* Status do fluxo */}
          {PHASE_LABEL[phase] && phase !== 'error' && phase !== 'notCompleted' && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              phase === 'settled'
                ? 'border-green-500/40 bg-green-500/10 text-green-300'
                : 'border-slate-700 bg-slate-800/50 text-slate-300'
            }`}>
              {phase === 'settled'
                ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
                : phase === 'ready'
                  ? <Info size={16} className="mt-0.5 shrink-0" />
                  : <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />}
              <span>{PHASE_LABEL[phase]}</span>
            </div>
          )}

          {phase === 'settled' && (
            <p className="text-xs text-slate-500">
              Próximo passo: use o CASSwap acima para trocar seu {token} por CAS
              ou BRLA.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                [{error.code}] {error.message}
                {error.details && <> — Detalhes: {typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}</>}
                {error.nextStep && <> — Próximo passo: {error.nextStep}</>}
              </span>
            </div>
          )}

          {/* Container do widget (iframe hospedado pela Circle/Arc) */}
          {widgetVisible && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div ref={containerRef} style={{ width: '100%', height: 720 }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                {widgetUrl ? (
                  <a
                    href={widgetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-400 hover:text-brand-300"
                  >
                    <ExternalLink size={12} /> Abrir em nova aba
                  </a>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-300"
                >
                  <RefreshCw size={12} /> Fechar onramp
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
