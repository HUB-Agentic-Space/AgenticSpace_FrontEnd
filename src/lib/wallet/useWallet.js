'use client';

/**
 * @file useWallet.js
 * @description Hook React que abstrai a conexão com carteiras blockchain.
 *
 * Detecta o ambiente (desktop/mobile) e usa a estratégia correta:
 *  - Desktop com extensão: provider injetado (window.ethereum)
 *  - Mobile: MetaMask SDK (deep link para o app)
 *  - Fallback: WalletConnect v2 (QR code)
 *
 * Expõe uma API unificada para todos os componentes que precisam
 * interagir com a blockchain.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  getWalletProviderFactory,
  isMobileDevice,
  hasInjectedProvider,
} from '@/lib/wallet/walletProviderFactory';

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

/**
 * Hook de conexão com carteira.
 *
 * @param {object} [opts]
 *  @param {number[]} [opts.chains] - Chain IDs suportados (default: [137])
 * @returns {{
 *   provider: object|null,
 *   ethersProvider: ethers.BrowserProvider|null,
 *   account: string|null,
 *   chainId: number|null,
 *   isConnecting: boolean,
 *   isMobile: boolean,
 *   walletType: string,
 *   error: string|null,
 *   connect: () => Promise<{ accounts: string[], provider: object }>,
 *   connectWalletConnect: () => Promise<{ accounts: string[], provider: object }>,
 *   disconnect: () => Promise<void>,
 *   switchChain: (chainId: number) => Promise<void>,
 *   getProvider: () => object|null,
 * }}
 */
export function useWallet(opts = {}) {
  const chains = opts.chains || [137];

  const [provider, setProvider] = useState(null);
  const [ethersProvider, setEthersProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState('none');

  const providerRef = useRef(null);
  const isMobile = isMobileDevice();

  const _syncProvider = useCallback((p, type) => {
    providerRef.current = p;
    setProvider(p);
    setWalletType(type);
    if (p) {
      const ep = new ethers.BrowserProvider(p);
      setEthersProvider(ep);
    } else {
      setEthersProvider(null);
    }
  }, []);

  const _syncAccountsAndChain = useCallback(async (p) => {
    try {
      const accounts = await p.request({ method: 'eth_accounts' });
      setAccount(accounts?.[0] || null);
    } catch {
      setAccount(null);
    }
    try {
      const cid = await p.request({ method: 'eth_chainId' });
      setChainId(cid ? parseInt(cid, 16) : null);
    } catch {
      setChainId(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const factory = getWalletProviderFactory();
      const { provider: p, type } = factory.createAuto({
        walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
        chains,
      });

      if (!p) {
        throw new Error(
          isMobile
            ? 'Nenhuma carteira encontrada. Instale o app MetaMask ou uma carteira compatível.'
            : 'MetaMask não está instalado. Instale a extensão ou use um navegador compatível.'
        );
      }

      const accounts = await p.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta conectada.');
      }

      _syncProvider(p, type);
      setAccount(accounts[0]);

      try {
        const cid = await p.request({ method: 'eth_chainId' });
        setChainId(cid ? parseInt(cid, 16) : null);
      } catch {
        // chainId opcional neste ponto.
      }

      p.on?.('accountsChanged', (accs) => {
        setAccount(accs?.[0] || null);
      });
      p.on?.('chainChanged', (cidHex) => {
        setChainId(cidHex ? parseInt(cidHex, 16) : null);
      });

      return { accounts, provider: p };
    } catch (err) {
      setError(err.message || 'Falha ao conectar carteira.');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [chains, isMobile, _syncProvider]);

  const connectWalletConnect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (!WALLETCONNECT_PROJECT_ID) {
        throw new Error(
          'WalletConnect não configurado. Defina NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.'
        );
      }

      const factory = getWalletProviderFactory();
      const p = factory.createWalletConnect({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains,
      });

      const accounts = await p.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta conectada via WalletConnect.');
      }

      _syncProvider(p, 'walletconnect');
      setAccount(accounts[0]);

      try {
        const cid = await p.request({ method: 'eth_chainId' });
        setChainId(cid ? parseInt(cid, 16) : null);
      } catch {
        // chainId opcional.
      }

      p.on?.('accountsChanged', (accs) => {
        setAccount(accs?.[0] || null);
      });
      p.on?.('chainChanged', (cidHex) => {
        setChainId(cidHex ? parseInt(cidHex, 16) : null);
      });

      return { accounts, provider: p };
    } catch (err) {
      setError(err.message || 'Falha ao conectar via WalletConnect.');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [chains, _syncProvider]);

  const disconnect = useCallback(async () => {
    if (providerRef.current) {
      try {
        await providerRef.current.disconnect();
      } catch {
        // Ignora erros.
      }
    }
    providerRef.current = null;
    setProvider(null);
    setEthersProvider(null);
    setAccount(null);
    setChainId(null);
    setWalletType('none');
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    const p = providerRef.current;
    if (!p) throw new Error('Carteira não conectada.');

    const targetHex = '0x' + targetChainId.toString(16);
    try {
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      setChainId(targetChainId);
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await p.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetHex,
            chainName: targetChainId === 137 ? 'Polygon Mainnet' : `Chain ${targetChainId}`,
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          }],
        });
        setChainId(targetChainId);
      } else {
        throw new Error(
          `Conecte-se à rede chainId=${targetChainId} na carteira.`
        );
      }
    }
  }, []);

  const getProvider = useCallback(() => providerRef.current, []);

  useEffect(() => {
    if (hasInjectedProvider() && !providerRef.current) {
      const factory = getWalletProviderFactory();
      const p = factory.createInjected();
      if (p) {
        _syncProvider(p, 'injected');
        _syncAccountsAndChain(p);
        p.on?.('accountsChanged', (accs) => {
          setAccount(accs?.[0] || null);
        });
        p.on?.('chainChanged', (cidHex) => {
          setChainId(cidHex ? parseInt(cidHex, 16) : null);
        });
      }
    }
  }, [_syncProvider, _syncAccountsAndChain]);

  return {
    provider,
    ethersProvider,
    account,
    chainId,
    isConnecting,
    isMobile,
    walletType,
    error,
    connect,
    connectWalletConnect,
    disconnect,
    switchChain,
    getProvider,
  };
}
