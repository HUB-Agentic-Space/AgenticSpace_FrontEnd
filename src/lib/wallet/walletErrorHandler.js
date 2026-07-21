/**
 * @file walletErrorHandler.js
 * @description Utilitário compartilhado para traduzir erros técnicos de wallet
 * (ethers.js / MetaMask / EIP-1193) em mensagens amigáveis ao usuário leigo.
 *
 * Padrões: Factory (parseWalletError) + Value Object (ParsedWalletError).
 */

import { ethers } from 'ethers';

/* -------------------------------------------------------------------------- */
/*                           Tipos e constantes                               */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} ParsedWalletError
 * @property {string} title       - Título curto do erro.
 * @property {string} message     - Mensagem amigável em PT-BR.
 * @property {Object} details     - Detalhes opcionais para exibição.
 * @property {string} [details.walletAddress]   - Endereço formatado (6+4).
 * @property {string} [details.gasEstimate]     - Gas estimado em POL.
 * @property {string} [details.networkName]     - Nome da rede.
 * @property {string} [details.nextStep]        - Próximo passo sugerido.
 * @property {'error'|'warning'|'info'} severity - Nível de gravidade.
 * @property {string} code         - Código interno do erro.
 */

const ERROR_CODES = {
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NONCE_EXPIRED: 'NONCE_EXPIRED',
  CALL_EXCEPTION: 'CALL_EXCEPTION',
  TIMEOUT: 'TIMEOUT',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  RPC_ERROR: 'RPC_ERROR',
  REPLACEMENT_UNDERPRICED: 'REPLACEMENT_UNDERPRICED',
  UNCONFIGURED_NETWORK: 'UNCONFIGURED_NETWORK',
  UNKNOWN: 'UNKNOWN',
};

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

/**
 * Formata um endereço de carteira para exibição amigável.
 * @param {string} addr - Endereço hexadecimal.
 * @returns {string}
 */
function formatAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Converte um valor em wei para uma string legível em POL.
 * @param {bigint|string|number} wei - Valor em wei.
 * @returns {string}
 */
function formatGasInPol(wei) {
  try {
    const bigVal = BigInt(wei);
    if (bigVal === 0n) return '0 POL';
    const formatted = ethers.formatEther(bigVal);
    return `${parseFloat(formatted).toFixed(6)} POL`;
  } catch {
    return '';
  }
}

/**
 * Estima o custo de gas a partir dos overrides e gas limit típico.
 * @param {Object} gasOverrides - Overrides de gas (maxFeePerGas, maxPriorityFeePerGas).
 * @param {bigint} [gasLimit] - Gas limit estimado (default: 200000).
 * @returns {string}
 */
function estimateGasCost(gasOverrides, gasLimit = 200000n) {
  if (!gasOverrides) return '';
  try {
    const maxFee = BigInt(gasOverrides.maxFeePerGas || 0n);
    if (maxFee === 0n) return '';
    const totalWei = maxFee * gasLimit;
    return formatGasInPol(totalWei);
  } catch {
    return '';
  }
}

/**
 * Extrai o endereço da carteira do erro ou do contexto.
 * @param {Error} error - Erro original.
 * @param {Object} [context] - Contexto adicional.
 * @returns {string}
 */
function extractWalletAddress(error, context) {
  if (context?.account) return context.account;
  const payload = error?.info?.payload?.params?.[0];
  if (payload?.from) return payload.from;
  if (error?.info?.payload?.params?.[0]?.from) return error.info.payload.params[0].from;
  return '';
}

/**
 * Extrai o gas estimado do erro ou do contexto.
 * @param {Error} error - Erro original.
 * @param {Object} [context] - Contexto adicional.
 * @returns {string}
 */
function extractGasEstimate(error, context) {
  if (context?.gasOverrides) {
    const est = estimateGasCost(context.gasOverrides);
    if (est) return est;
  }
  const txParams = error?.info?.payload?.params?.[0];
  if (txParams?.gas && txParams?.maxFeePerGas) {
    try {
      const gas = BigInt(txParams.gas);
      const fee = BigInt(txParams.maxFeePerGas);
      return formatGasInPol(gas * fee);
    } catch {
      // ignore
    }
  }
  return '';
}

/**
 * Extrai o nome da rede do contexto.
 * @param {Object} [context] - Contexto adicional.
 * @returns {string}
 */
function extractNetworkName(context) {
  if (!context?.config?.chainId) return '';
  return context.config.chainId === 137 ? 'Polygon Mainnet' : `Chain ${context.config.chainId}`;
}

/* -------------------------------------------------------------------------- */
/*                        Função principal                                    */
/* -------------------------------------------------------------------------- */

/**
 * Traduz um erro de wallet em uma mensagem amigável estruturada.
 *
 * @param {Error|Object} error - Erro bruto da wallet / ethers.js.
 * @param {Object} [context] - Contexto adicional da operação.
 * @param {string} [context.account] - Endereço da carteira conectada.
 * @param {Object} [context.gasOverrides] - Overrides de gas usados.
 * @param {Object} [context.config] - Configuração on-chain (chainId, etc).
 * @returns {ParsedWalletError}
 */
export function parseWalletError(error, context = {}) {
  if (!error) {
    return {
      title: 'Erro desconhecido',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      details: {},
      severity: 'error',
      code: ERROR_CODES.UNKNOWN,
    };
  }

  const rawMessage = error.shortMessage || error.reason || error.message || '';
  const lowerMsg = (rawMessage || '').toLowerCase();
  const errorCode = error.code;
  const action = error.action || error.info?.action;

  // 1. Usuário rejeitou a transação
  if (
    errorCode === 4001 ||
    errorCode === 'ACTION_REJECTED' ||
    /user rejected|user denied|user rejected action/i.test(rawMessage)
  ) {
    const addr = extractWalletAddress(error, context);
    const gas = extractGasEstimate(error, context);
    const details = {};
    if (addr) details.walletAddress = formatAddress(addr);
    if (gas) details.gasEstimate = gas;
    return {
      title: 'Transação Rejeitada',
      message:
        'Você cancelou a transação na carteira. O registro não foi concluído.' +
        (addr ? ` A carteira ${formatAddress(addr)} não autorizou a operação.` : ''),
      details: {
        ...details,
        nextStep: 'Para concluir o registro, clique novamente em "Registrar na Blockchain" e approve a transação na carteira.',
      },
      severity: 'warning',
      code: ERROR_CODES.USER_REJECTED,
    };
  }

  // 2. Saldo insuficiente
  if (
    errorCode === 'INSUFFICIENT_FUNDS' ||
    /insufficient funds|insufficient balance/i.test(rawMessage)
  ) {
    const network = extractNetworkName(context);
    return {
      title: 'Saldo Insuficiente',
      message:
        'Seu saldo não é suficiente para pagar a taxa de rede (gas)' +
        (network ? ` na ${network}` : '') +
        '. Adicione POL à sua carteira ou escolha outro asset de pagamento.',
      details: {
        networkName: network,
        nextStep: 'Adicione POL à carteira via faucet, exchange ou swap, e tente novamente.',
      },
      severity: 'error',
      code: ERROR_CODES.INSUFFICIENT_FUNDS,
    };
  }

  // 3. Erro de rede / chain incorreta
  if (
    errorCode === 'NETWORK_ERROR' ||
    /network error|wrong chain|chain.*mismatch|unknown chain/i.test(rawMessage) ||
    (action === 'switchChain' && error.code === 4902)
  ) {
    const network = extractNetworkName(context);
    return {
      title: 'Rede Incorreta',
      message:
        'Sua carteira está conectada em uma rede incorreta.' +
        (network ? ` Selecione a rede ${network} (chain 137) na carteira.` : ' Selecione a rede Polygon (chain 137) na carteira.'),
      details: {
        networkName: network,
        nextStep: 'Abra a carteira, troque para a rede Polygon Mainnet (chain 137) e tente novamente.',
      },
      severity: 'warning',
      code: ERROR_CODES.NETWORK_ERROR,
    };
  }

  // 4. Nonce expirado
  if (
    errorCode === 'NONCE_EXPIRED' ||
    /nonce.*expired|nonce too low|replacement underpriced/i.test(rawMessage)
  ) {
    return {
      title: 'Transação Expirada',
      message: 'A transação expirou ou foi substituída. Isso pode acontecer se houver transações pendentes na carteira.',
      details: {
        nextStep: 'Cancele transações pendentes na carteira e tente novamente.',
      },
      severity: 'warning',
      code: ERROR_CODES.NONCE_EXPIRED,
    };
  }

  // 5. Replacement underpriced
  if (/replacement underpriced/i.test(rawMessage)) {
    return {
      title: 'Taxa de Rede Baixa',
      message: 'A taxa de rede oferecida é muito baixa para substituir uma transação pendente.',
      details: {
        nextStep: 'Aumente a taxa de gas na carteira ou cancele a transação pendente antes de tentar novamente.',
      },
      severity: 'warning',
      code: ERROR_CODES.REPLACEMENT_UNDERPRICED,
    };
  }

  // 6. Call exception / revert
  if (
    errorCode === 'CALL_EXCEPTION' ||
    /revert|execution reverted|missing revert data|could not coalesce/i.test(rawMessage)
  ) {
    let hint = 'Possíveis causas: saldo CAS insuficiente, taxa de aprovação não concedida, ou você já está registrado.';
    if (/already registered|user already exists|agent already exists/i.test(rawMessage)) {
      hint = 'Parece que você já está registrado na blockchain.';
    } else if (/allowance|approve/i.test(rawMessage)) {
      hint = 'A aprovação de tokens CAS não foi concedida. Tente novamente.';
    } else if (/insufficient|balance/i.test(rawMessage)) {
      hint = 'Saldo de tokens insuficiente para completar a operação.';
    }
    return {
      title: 'Transação Revertida',
      message: `A transação foi revertida pelo contrato. ${hint}`,
      details: {
        nextStep: 'Verifique seu saldo e aprovações de tokens, e tente novamente. Se o problema persistir, contate o suporte.',
      },
      severity: 'error',
      code: ERROR_CODES.CALL_EXCEPTION,
    };
  }

  // 7. Timeout
  if (
    errorCode === 'TIMEOUT' ||
    /timeout|timed out/i.test(rawMessage)
  ) {
    return {
      title: 'Tempo Esgotado',
      message: 'A operação demorou demais para ser confirmada. Isso pode ocorrer por congestionamento na rede.',
      details: {
        nextStep: 'Verifique sua conexão com a internet e tente novamente. Se o problema persistir, aguarde alguns minutos.',
      },
      severity: 'warning',
      code: ERROR_CODES.TIMEOUT,
    };
  }

  // 8. Wallet não encontrada
  if (
    /metamask not found|wallet not found|no provider|install metamask/i.test(rawMessage) ||
    (error.code === -32603 && /not found/i.test(rawMessage))
  ) {
    return {
      title: 'Carteira Não Encontrada',
      message: 'Nenhuma carteira foi encontrada no navegador. Instale a extensão MetaMask ou use um navegador compatível.',
      details: {
        nextStep: 'Instale a extensão MetaMask em https://metamask.io e recarregue a página.',
      },
      severity: 'error',
      code: ERROR_CODES.WALLET_NOT_FOUND,
    };
  }

  // 9. Erro de RPC
  if (
    errorCode === 'RPC_ERROR' ||
    /rpc error|internal error|server error|32603/i.test(rawMessage)
  ) {
    return {
      title: 'Erro de Comunicação',
      message: 'Houve um erro de comunicação com a rede blockchain. Tente novamente em alguns instantes.',
      details: {
        nextStep: 'Aguarde alguns segundos e tente novamente. Se o problema persistir, verifique o status da rede Polygon.',
      },
      severity: 'warning',
      code: ERROR_CODES.RPC_ERROR,
    };
  }

  // 10. Rede não configurada (addEthereumChain falhou)
  if (errorCode === 4902 || /unrecognized chain|chain not configured/i.test(rawMessage)) {
    const network = extractNetworkName(context);
    return {
      title: 'Rede Não Configurada',
      message:
        `A rede ${network || 'Polygon'} não está configurada na sua carteira.` +
        ' Tente adicionar a rede manualmente ou use o botão de troca de rede.',
      details: {
        networkName: network,
        nextStep: 'Adicione a rede Polygon Mainnet (chain 137) manualmente na carteira e tente novamente.',
      },
      severity: 'warning',
      code: ERROR_CODES.UNCONFIGURED_NETWORK,
    };
  }

  // Fallback: erro desconhecido — sanitiza a mensagem
  const safeMsg = rawMessage
    .replace(/0x[0-9a-fA-F]{64,}/g, '[hash]')
    .replace(/0x[0-9a-fA-F]{40}/g, '[address]')
    .replace(/code=\d+/g, '')
    .replace(/version=[\d.]+/g, '')
    .trim();

  return {
    title: 'Erro Inesperado',
    message: safeMsg || 'Ocorreu um erro inesperado durante a operação com a carteira.',
    details: {
      nextStep: 'Tente novamente. Se o problema persistir, contate o suporte.',
    },
    severity: 'error',
    code: ERROR_CODES.UNKNOWN,
  };
}

export { ERROR_CODES };
