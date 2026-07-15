'use client';

/**
 * @file AddTokenButton.js
 * @description Botão reutilizável que adiciona um token ERC-20 à MetaMask
 *              via EIP-747 (wallet_watchAsset). Mostra estados de loading,
 *              sucesso e erro.
 *
 * Padrão: Factory (configura o token a partir de props)
 */

import { useState } from 'react';
import { Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useWatchAsset, getTokenIconUrl } from '@/lib/useWatchAsset';

/**
 * @param {Object} props
 * @param {string} props.address Endereço do contrato (checksum).
 * @param {string} props.symbol Símbolo do token (ex: "CAS").
 * @param {number} [props.decimals] Decimais do token. Default: 18.
 * @param {number} [props.chainId] Chain ID esperado (ex: 137).
 * @param {string} [props.image] URL do ícone. Se omitido, deriva do endereço.
 * @param {string} [props.label] Texto do botão. Default: "Adicionar à MetaMask".
 * @param {string} [props.className] Classes CSS adicionais.
 */
export default function AddTokenButton({
  address,
  symbol,
  decimals = 18,
  chainId,
  image,
  label = 'Adicionar à MetaMask',
  className = '',
}) {
  const { watchAsset, pending } = useWatchAsset();
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleClick() {
    setStatus('idle');
    setErrorMsg('');

    const iconUrl = image || getTokenIconUrl(address);

    const { success, error } = await watchAsset({
      address,
      symbol,
      decimals,
      image: iconUrl,
      chainId,
    });

    if (success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(error || 'Falha ao adicionar token.');
    }
  }

  const baseClass =
    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors';

  let btnClass = `${baseClass} bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 ${className}`;

  if (status === 'success') {
    btnClass = `${baseClass} bg-green-500/10 text-green-400 border border-green-500/30 ${className}`;
  } else if (status === 'error') {
    btnClass = `${baseClass} bg-red-500/10 text-red-400 border border-red-500/30 ${className}`;
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className={btnClass}
        title={`Adicionar ${symbol} à MetaMask`}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : status === 'success' ? (
          <Check size={14} />
        ) : status === 'error' ? (
          <AlertCircle size={14} />
        ) : (
          <Plus size={14} />
        )}
        <span>
          {pending
            ? 'Adicionando...'
            : status === 'success'
              ? `${symbol} adicionado!`
              : status === 'error'
                ? 'Erro'
                : label}
        </span>
      </button>
      {status === 'error' && errorMsg && (
        <span className="text-xs text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}
