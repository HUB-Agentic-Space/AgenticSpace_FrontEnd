'use client';

/**
 * @file useWatchAsset.js
 * @description Hook para adicionar tokens ERC-20 à MetaMask via EIP-747
 *              (wallet_watchAsset). Não requer transação on-chain — é uma
 *              chamada RPC client-side que abre um popup na carteira.
 *
 * Padrão: Strategy (EIP-747 vs futuros padrões de metadata)
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet/useWallet';

/** URL base pública para os ícones de token. */
const TOKEN_ICON_BASE_URL =
  process.env.NEXT_PUBLIC_TOKEN_ICON_BASE_URL ||
  'https://app.agenticspace.rapport.tec.br/tokens';

/**
 * Constrói a URL pública do ícone PNG de um token pelo endereço.
 * @param {string} address Endereço do contrato (checksum ou lowercase).
 * @returns {string} URL completa para o PNG 256x256.
 */
export function getTokenIconUrl(address) {
  return `${TOKEN_ICON_BASE_URL}/${address}.png`;
}

/**
 * Solicita à carteira (MetaMask) que adicione um token ERC-20 via EIP-747.
 *
 * @param {Object} params
 * @param {string} params.address Endereço do contrato (checksum).
 * @param {string} params.symbol Símbolo do token (ex: "CAS").
 * @param {number} params.decimals Decimais do token (ex: 18).
 * @param {string} [params.image] URL do ícone PNG. Se omitido, deriva do endereço.
 * @param {number} [params.chainId] Chain ID esperado (ex: 137). Se informado,
 *        tenta trocar a rede antes de adicionar o token.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export function useWatchAsset() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const { connect, getProvider } = useWallet();

  const watchAsset = useCallback(
    async ({ address, symbol, decimals, image, chainId }) => {
      setPending(true);
      setResult(null);

      try {
        let provider = getProvider();
        if (!provider) {
          const { provider: connectedProvider } = await connect();
          provider = connectedProvider;
        }
        if (!provider) {
          throw new Error('Carteira não encontrada.');
        }

        const iconUrl = image || getTokenIconUrl(address);

        if (chainId) {
          const currentChain = await provider.request({
            method: 'eth_chainId',
          });
          const targetChainHex = '0x' + chainId.toString(16);
          if (currentChain !== targetChainHex) {
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: targetChainHex }],
              });
            } catch {
              throw new Error(
                `Conecte-se à rede chainId=${chainId} na carteira antes de adicionar o token.`
              );
            }
          }
        }

        const added = await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol,
              decimals,
              image: iconUrl,
            },
          },
        });

        const res = { success: Boolean(added) };
        setResult(res);
        return res;
      } catch (err) {
        const res = { success: false, error: err.message };
        setResult(res);
        return res;
      } finally {
        setPending(false);
      }
    },
    [connect, getProvider]
  );

  return { watchAsset, pending, result };
}
