'use client';

/**
 * @file OnrampPanel.js
 * @description Painel de onramp fiat → cripto usando o Onramp Kit da Circle
 *              (@circle-fin/onramp-kit), conforme o guia
 *              https://www.arc.io/blog/add-usdc-funding-to-your-app-without-building-an-onramp-from-scratch
 *              e a documentação do App Kit (docs.arc.io/app-kit/onramp).
 *
 *              Fluxo: (1) o backend cunha uma sessão curta via
 *              POST /api/v1/onramp/sessions; (2) este componente abre o
 *              widget hospedado em nova janela (`onramp.openWindow`) ou, quando
 *              a origem é permitida pelo frame-ancestors do provedor, embute
 *              via `onramp.mountIframe`; (3) os eventos de ciclo de vida
 *              dirigem o status exibido. O usuário escolhe o token
 *              (USDC/EURC — os únicos entregues pelo onramp) e a rede de
 *              destino (Arc, Polygon e demais do catálogo).
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
  openedExternal: 'Conclua o pagamento na janela que abrir.',
  submitted: 'Depósito enviado — aguardando liquidação on-chain.',
  settled: 'Depósito liquidado! Os tokens foram enviados para a sua carteira.',
};

/**
 * Decide se o iframe do widget pode ser embutido na origem atual, com base
 * no CSP `frame-ancestors` que o provedor aplica:
 *  - produção com referrerDomain selado na sessão: apenas aquele hostname;
 *  - produção sem referrerDomain: qualquer origem HTTPS;
 *  - sandbox: qualquer HTTPS + http://localhost:<porta> (somente o hostname
 *    literal `localhost` — 127.0.0.1 e IPs de LAN não casam).
 */
function computeCanEmbed(config) {
  if (typeof window === 'undefined' || !config?.enabled) return true;
  const { hostname, protocol } = window.location;
  if (config.sandbox) return protocol === 'https:' || hostname === 'localhost';
  return protocol === 'https:' && (!config.referrerDomain || hostname === config.referrerDomain);
}

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
  const [phase, setPhase] = useState('idle'); // idle|minting|loading|ready|openedExternal|popupBlocked|submitted|settled|notCompleted|error
  const [error, setError] = useState(null); // { code, message, details, nextStep }
  const [widgetUrl, setWidgetUrl] = useState(null);
  const [session, setSession] = useState(null); // sessão em uso no modo iframe
  const [pendingSession, setPendingSession] = useState(null); // sessão mintada aguardando retry de popup

  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const kitRef = useRef(null);
  const kitBaseUrlRef = useRef(null);
  const modeRef = useRef('window'); // 'window' (popup) | 'iframe' — usado no relançamento pós-expiração

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

  // Se false, o frame-ancestors do widget recusaria esta origem — o fluxo
  // cai para abertura em nova aba (popup não depende de frame-ancestors).
  const canEmbed = computeCanEmbed(config);

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
          // tokens + chains restringem o seletor do widget (semântica AND),
          // fixando visualmente a escolha feita nos selects acima.
          //assets: { tokens: [token], chains: [chain] },
          assets: { tokens: [token], chains: [chain] }, 
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

  /** Callbacks de ciclo de vida compartilhados por mountIframe e openWindow. */
  const buildLifecycle = () => ({
    loadTimeout: 20_000,
    onInitializationSuccess: () => setPhase(modeRef.current === 'iframe' ? 'ready' : 'openedExternal'),
    onInitializationError: (envelope) => {
      const code = envelope?.code || envelope?.payload?.code;
      if (code === 'INVALID_SESSION_TOKEN') {
        // Sessão rejeitada/expirada: recunha e relança no mesmo modo.
        setSession(null);
        mintAndLaunch(modeRef.current);
        return;
      }
      setPhase('error');
      setError({
        code: code || 'INIT_ERROR',
        message: 'O widget do onramp não conseguiu iniciar.',
        nextStep: 'Recarregue a página ou tente abrir o onramp em uma nova janela.',
      });
    },
    onSessionExpired: () => {
      // Sessão expirou com o fluxo aberto: recunha e relança no mesmo modo.
      setSession(null);
      mintAndLaunch(modeRef.current);
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

  /** Monta o widget iframe quando a sessão corrente é do modo embutido. */
  useEffect(() => {
    if (!session || modeRef.current !== 'iframe' || !containerRef.current) return;
    setPhase('loading');
    try {
      closeWidget();
      widgetRef.current = getKit().mountIframe({
        session,
        container: containerRef.current,
        ...buildLifecycle(),
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

  /**
   * Cunha a sessão e lança o onramp no modo escolhido:
   *  - 'window': popup via openWindow — ignora o frame-ancestors do provedor
   *    e funciona em qualquer origem. Se o navegador bloquear a janela
   *    (gesto consumido pelo await da cunhagem), guarda a sessão e exibe um
   *    botão de retry que abre em gesto síncrono — 'blocked' é fluxo normal.
   *  - 'iframe': embute na página (só oferecido quando a origem é permitida
   *    pelo frame-ancestors do provedor — ver computeCanEmbed).
   */
  const mintAndLaunch = useCallback(async (mode) => {
    modeRef.current = mode;
    setError(null);
    setPendingSession(null);
    setPhase('minting');
    try {
      const fresh = await mintSession();
      setWidgetUrl(fresh?.widgetUrl || null);
      if (mode === 'iframe') {
        setSession(fresh); // o useEffect acima monta o iframe
        return;
      }
      const result = getKit().openWindow({ session: fresh, ...buildLifecycle() });
      if (result.status === 'opened') {
        widgetRef.current = result.widget;
        setPhase('openedExternal');
        return;
      }
      setPendingSession(fresh);
      setPhase('popupBlocked');
      setError({
        code: 'POPUP_BLOCKED',
        message: result.errorMessage || 'O navegador bloqueou a janela do onramp.',
        nextStep: 'Clique em "Abrir janela do onramp" abaixo para continuar — a sessão já foi criada.',
      });
    } catch (err) {
      setPhase('error');
      setError(err?.code ? err : {
        code: 'ONRAMP_SESSION_FAILED',
        message: err?.message || 'Falha ao criar a sessão de onramp.',
        nextStep: 'Tente novamente em instantes.',
      });
    }
  }, [mintSession, getKit]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Reabre a janela com a sessão já mintada — chamado por clique síncrono. */
  const retryOpenWindow = useCallback(() => {
    if (!pendingSession) return;
    try {
      const result = getKit().openWindow({ session: pendingSession, ...buildLifecycle() });
      if (result.status === 'opened') {
        widgetRef.current = result.widget;
        setPendingSession(null);
        setError(null);
        setPhase('openedExternal');
        return;
      }
      setError({
        code: 'POPUP_BLOCKED',
        message: result.errorMessage || 'A janela continua bloqueada pelo navegador.',
        nextStep: 'Permita pop-ups para este site ou use o link "Abrir em nova aba".',
      });
    } catch (err) {
      setPhase('error');
      setError({
        code: err?.name || 'OPEN_WINDOW_FAILED',
        message: err?.message || 'Não foi possível abrir a janela do onramp.',
        nextStep: 'Use o link "Abrir em nova aba" abaixo ou recarregue a página.',
      });
    }
  }, [pendingSession, getKit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    if (!account) {
      try { await connect(); } catch { /* erro já tratado pelo hook */ }
      return;
    }
    await mintAndLaunch('window');
  }, [account, connect, mintAndLaunch]);

  const handleClose = useCallback(() => {
    closeWidget();
    setSession(null);
    setPendingSession(null);
    setWidgetUrl(null);
    setPhase('idle');
    setError(null);
  }, [closeWidget]);

  // ---------------------------------------------------------------- render
  const tokens = config?.supportedTokens?.length ? config.supportedTokens : ['USDC', 'EURC'];
  const chains = config?.allowedChains?.length ? config.allowedChains : Object.keys(CHAIN_LABELS);
  const busy = phase === 'minting' || phase === 'loading' || isConnecting;
  const widgetVisible = Boolean(session);
  // Sessão já mintada (em qualquer modo): os selects ficam travados porque
  // token/rede foram selados na sessão — mudar aqui não afetaria a janela.
  const sessionActive =
    widgetVisible || Boolean(pendingSession) ||
    ['openedExternal', 'popupBlocked', 'submitted', 'settled'].includes(phase);

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
                disabled={busy || sessionActive}
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
                disabled={busy || sessionActive}
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
              <strong className="text-slate-400">BRLA ou CAS</strong> não são vendidos ainda.
              Para obte-los: compre USDC aqui e faça swap
              USDC → BRLA/CAS no CASSwap acima. A verificação de identidade (KYC)
              acontece dentro do widget hospedado pela Circle.
            </span>
          </p>

          {/* Aviso de domínio: iframe seria bloqueado pelo frame-ancestors */}
          {!canEmbed && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                {config?.referrerDomain ? (
                  <>
                    O widget embutido só pode ser exibido em{' '}
                    <strong>{config.referrerDomain}</strong> (domínio registrado
                    no provedor). Esta página está em{' '}
                    <strong>{typeof window !== 'undefined' ? window.location.host : ''}</strong>.
                  </>
                ) : (
                  <>O widget embutido exige HTTPS neste ambiente.</>
                )}{' '}
                Por isso só o modo &quot;nova janela&quot; está disponível aqui — ele
                funciona em qualquer origem. Para embutir em desenvolvimento
                local, use o modo sandbox e acesse exatamente
                http://localhost:&lt;porta&gt; (127.0.0.1 e IPs de LAN não
                são aceitos pelo provedor).
              </span>
            </div>
          )}

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

          {/* Ação principal: nova janela (sempre funciona) ou embutido */}
          {account && !widgetVisible && phase !== 'popupBlocked' && (
            <button
              onClick={() => mintAndLaunch(canEmbed ? 'iframe' : 'window')}
              disabled={busy}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Comprar
            </button>
          )}

          {/* Retry de popup bloqueado — clique em gesto síncrono */}
          {phase === 'popupBlocked' && pendingSession && (
            <button
              onClick={retryOpenWindow}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              Abrir janela do onramp
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
            </div>
          )}

          {/* Link direto + fechar (disponível assim que a sessão existe) */}
          {(widgetVisible || widgetUrl) && phase !== 'idle' && (
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
          )}
        </>
      )}
    </div>
  );
}
