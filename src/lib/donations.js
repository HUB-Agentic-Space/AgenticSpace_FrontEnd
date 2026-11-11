/**
 * @file lib/donations.js
 * @description Constantes e configuração da página de transparência de doações:
 * carteira receptora, chains e tokens monitorados on-chain via RPC público.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

/** Carteira EVM receptora de doações (USDC/USDT/ETH/POL/BRLA). */
export const DONATION_WALLET = '0xb72E7E3225eb846db1E4e346703a5ba2Cc89B837';

/** ABI mínima ERC-20 para leitura de saldo e decimais. */
export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

/**
 * Chains monitoradas na página de transparência. Cada entrada lista RPCs
 * públicos (com fallback) e os ativos consultados — `native: true` para o
 * token nativo, ou `address`/`decimals` para ERC-20.
 *
 * BRLA é o real tokenizado (Brasil Token) emitido na Polygon.
 */
export const DONATION_CHAINS = [
  {
    id: 'ethereum',
    label: 'Ethereum',
    chainId: 1,
    rpcs: [
      'https://ethereum-rpc.publicnode.com'
    ],
    explorer: (addr) => `https://etherscan.io/address/${addr}`,
    assets: [
      { symbol: 'ETH', native: true, decimals: 18 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    ]
  },
  {
    id: 'polygon',
    label: 'Polygon',
    chainId: 137,
    rpcs: [
      'https://polygon-bor-rpc.publicnode.com'
    ],
    explorer: (addr) => `https://polygonscan.com/address/${addr}`,
    assets: [
      { symbol: 'POL', native: true, decimals: 18 },
      { symbol: 'USDC.e', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'BRLA', address: '0xE6A537a407488807F0bbeb0038B79004f19DDDFb', decimals: 18 }
    ]
  },
  {
    id: 'arc',
    label: 'ARC Mainnet',
    chainId: 5042,
    rpcs: ['https://rpc.mainnet.arc.io'],
    explorer: (addr) => `https://explorer.arc.io/address/${addr}`,
    assets: [{ symbol: 'USDC', native: true, decimals: 18 }]
  }
];
