'use client';

/**
 * @file walletProviderFactory.js
 * @description Factory para criação de provedores de carteira (EIP-1193).
 *
 * Padrões: Factory (GoF) + Abstract Factory para criar a estratégia
 * correta conforme o ambiente (desktop injetado, mobile MetaMask SDK,
 * ou WalletConnect v2 como fallback).
 *
 * Cada provedor implementa a mesma interface EIP-1193:
 *   - request({ method, params }) => Promise<any>
 *   - on(event, callback) => void
 *   - removeListener(event, callback) => void
 *   - disconnect() => Promise<void>
 */

/* -------------------------------------------------------------------------- */
/*  Utilitários de detecção de ambiente                                       */
/* -------------------------------------------------------------------------- */

/**
 * Detecta se o dispositivo é mobile via User-Agent.
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || navigator.vendor || ''
  );
}

/**
 * Verifica se `window.ethereum` está disponível (extensão injetada).
 * @returns {boolean}
 */
export function hasInjectedProvider() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/* -------------------------------------------------------------------------- */
/*  Provedor base (interface abstrata)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Interface base para provedores de carteira.
 * Subclasses devem implementar todos os métodos.
 */
class BaseWalletProvider {
  /** @returns {Promise<any>} */
  async request() {
    throw new Error('request() not implemented');
  }

  on() {
    throw new Error('on() not implemented');
  }

  removeListener() {
    throw new Error('removeListener() not implemented');
  }

  async disconnect() {
    throw new Error('disconnect() not implemented');
  }
}

/* -------------------------------------------------------------------------- */
/*  Provedor injetado (desktop com extensão)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wrapper sobre `window.ethereum` (extensão MetaMask no desktop).
 * Mantém compatibilidade total com o fluxo atual.
 */
export class InjectedWalletProvider extends BaseWalletProvider {
  /** @param {object} injected - objeto window.ethereum */
  constructor(injected) {
    super();
    this._provider = injected;
  }

  async request(args) {
    return this._provider.request(args);
  }

  on(event, cb) {
    this._provider.on?.(event, cb);
  }

  removeListener(event, cb) {
    this._provider.removeListener?.(event, cb);
  }

  async disconnect() {
    // Provedores injetados não suportam disconnect explícito.
  }
}

/* -------------------------------------------------------------------------- */
/*  Provedor MetaMask SDK (mobile deep link)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Usa @metamask/sdk para conectar via deep link no celular.
 * O SDK abre o app MetaMask e retorna a conexão quando o usuário volta.
 */
export class MetaMaskSDKWalletProvider extends BaseWalletProvider {
  constructor() {
    super();
    this._sdk = null;
    this._provider = null;
    this._sdkInitPromise = null;
  }

  /** Inicializa o SDK sob demanda, com proteção contra race condition. */
  async _ensureSDK() {
    if (this._sdk) return;
    if (this._sdkInitPromise) return this._sdkInitPromise;
    this._sdkInitPromise = (async () => {
      const mod = await import('@metamask/sdk');
      const MetaMaskSDK = mod.MetaMaskSDK || mod.default;
      if (!MetaMaskSDK) {
        throw new Error('MetaMask SDK não pôde ser carregado.');
      }
      this._sdk = new MetaMaskSDK({
        dappMetadata: {
          name: 'Agentic Space',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        },
        modal: { enabled: false },
      });
      await this._sdk.connect();
      this._provider = this._sdk.getProvider();
    })();
    return this._sdkInitPromise;
  }

  async request(args) {
    await this._ensureSDK();
    return this._provider.request(args);
  }

  on(event, cb) {
    this._ensureSDK().then(() => {
      this._provider.on?.(event, cb);
    });
  }

  removeListener(event, cb) {
    if (this._provider) {
      this._provider.removeListener?.(event, cb);
    }
  }

  async disconnect() {
    if (this._sdk) {
      try {
        await this._sdk.disconnect();
      } catch {
        // Ignora erros de disconnect.
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Provedor WalletConnect v2 (fallback multi-carteira)                      */
/* -------------------------------------------------------------------------- */

/**
 * Usa @walletconnect/ethereum-provider para conectar qualquer carteira
 * compatível via QR code ou deep link.
 */
export class WalletConnectWalletProvider extends BaseWalletProvider {
  /** @param {object} opts
   *  @param {string} opts.projectId - WalletConnect Cloud projectId
   *  @param {number[]} opts.chains - chain IDs suportados (ex: [137])
   *  @param {object[]} [opts.optionalChains]
   */
  constructor(opts) {
    super();
    this._opts = opts;
    this._provider = null;
    this._initPromise = null;
    this._connectPromise = null;
  }

  async _ensureProvider() {
    if (this._provider) return;
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const EthereumProvider = await import('@walletconnect/ethereum-provider');
      const Mod = EthereumProvider.default || EthereumProvider;
      this._provider = await Mod.init({
        projectId: this._opts.projectId,
        chains: this._opts.chains,
        optionalChains: this._opts.optionalChains,
        showQrModal: true,
      });
    })();
    return this._initPromise;
  }

  async _ensureConnected() {
    if (this._provider.connected) return;
    if (this._connectPromise) return this._connectPromise;
    this._connectPromise = this._provider.connect().finally(() => {
      this._connectPromise = null;
    });
    return this._connectPromise;
  }

  async request(args) {
    await this._ensureProvider();
    await this._ensureConnected();
    try {
      return await this._provider.request(args);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('connect() must be called before request()')) {
        this._connectPromise = null;
        await this._provider.connect();
        return this._provider.request(args);
      }
      throw err;
    }
  }

  on(event, cb) {
    this._ensureProvider().then(() => {
      this._provider.on(event, cb);
    });
  }

  removeListener(event, cb) {
    if (this._provider) {
      this._provider.removeListener(event, cb);
    }
  }

  async disconnect() {
    if (this._provider) {
      try {
        await this._provider.disconnect();
      } catch {
        // Ignora erros de disconnect.
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fábrica que cria o provedor de carteira apropriado.
 *
 * Estratégia:
 *  1. Desktop com window.ethereum → InjectedWalletProvider
 *  2. Mobile sem window.ethereum → MetaMaskSDKWalletProvider
 *  3. Fallback explícito → WalletConnectWalletProvider
 */
export class WalletProviderFactory {
  /**
   * Cria provedor injetado (desktop).
   * @returns {InjectedWalletProvider|null}
   */
  createInjected() {
    if (!hasInjectedProvider()) return null;
    return new InjectedWalletProvider(window.ethereum);
  }

  /**
   * Cria provedor MetaMask SDK (mobile deep link).
   * @returns {MetaMaskSDKWalletProvider}
   */
  createMetaMaskSDK() {
    return new MetaMaskSDKWalletProvider();
  }

  /**
   * Cria provedor WalletConnect v2.
   * @param {object} opts
   * @returns {WalletConnectWalletProvider}
   */
  createWalletConnect(opts) {
    return new WalletConnectWalletProvider(opts);
  }

  /**
   * Cria o melhor provedor automaticamente conforme o ambiente.
   *
   * @param {object} [opts]
   *  @param {string} [opts.walletConnectProjectId]
   *  @param {number[]} [opts.chains] - chain IDs (default: [137])
   * @returns {{ provider: BaseWalletProvider, type: string }}
   */
  createAuto(opts = {}) {
    const chains = opts.chains || [137];

    if (hasInjectedProvider()) {
      return {
        provider: this.createInjected(),
        type: 'injected',
      };
    }

    if (isMobileDevice()) {
      return {
        provider: this.createMetaMaskSDK(),
        type: 'metamask-sdk',
      };
    }

    if (opts.walletConnectProjectId) {
      return {
        provider: this.createWalletConnect({
          projectId: opts.walletConnectProjectId,
          chains,
        }),
        type: 'walletconnect',
      };
    }

    return { provider: null, type: 'none' };
  }
}

/* Singleton da fábrica. */
let _factoryInstance = null;

/**
 * Retorna a instância singleton de WalletProviderFactory.
 * @returns {WalletProviderFactory}
 */
export function getWalletProviderFactory() {
  if (!_factoryInstance) {
    _factoryInstance = new WalletProviderFactory();
  }
  return _factoryInstance;
}
