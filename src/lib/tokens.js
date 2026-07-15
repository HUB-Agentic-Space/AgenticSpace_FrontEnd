/**
 * @file tokens.js
 * @description Registro centralizado de tokens ERC-20 do Agentic Space.
 *              Usado por AddTokenButton, token lists, e outras integrações.
 *
 * Padrão: Registry (catálogo de tokens por rede)
 */

export const POLYGON_MAINNET_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;

export const TOKEN_ICON_BASE_URL =
  process.env.NEXT_PUBLIC_TOKEN_ICON_BASE_URL ||
  'https://app.agenticspace.rapport.tec.br/tokens';

/**
 * Tokens da Polygon Mainnet (chainId 137).
 * @type {Array<{ address: string, name: string, symbol: string, decimals: number, type: string }>}
 */
export const MAINNET_TOKENS = [
  {
    address: '0x5151A34EaC7bA08cd6B540b32cD30316218A2287',
    name: 'Agentic Space CAS Token v2.1',
    symbol: 'CAS',
    decimals: 18,
    type: 'token',
  },
  {
    address: '0xdF5Df5Eb32fa1a53749c66364B877C39b7031377',
    name: 'Agentic CAS Fund',
    symbol: 'aCAS',
    decimals: 18,
    type: 'fund-tracker',
  },
  {
    address: '0x5b82Fb12Cd034dAFC932ABb0995E9652EebE34CF',
    name: 'Agentic POL Fund',
    symbol: 'aPOL',
    decimals: 18,
    type: 'fund-tracker',
  },
  {
    address: '0x265D86d4D43c32037b032097e8bFB6893E1C3964',
    name: 'SushiSwap CAS/WPOL LP',
    symbol: 'SLP',
    decimals: 18,
    type: 'lp-token',
  },
  {
    address: '0xf77BD26fE17adb1bC99BE6Cd63414b2A7819690E',
    name: 'QuickSwap CAS/WPOL LP',
    symbol: 'QLP',
    decimals: 18,
    type: 'lp-token',
  },
  {
    address: '0xF27F3c3E305FEdf21B491A1d531fd4c3c80312B4',
    name: 'ApeSwap CAS/WPOL LP',
    symbol: 'ALP',
    decimals: 18,
    type: 'lp-token',
  },
  {
    address: '0x2275BFC0b1E26fB36a42E26fA1E5e4D823E62bc3',
    name: 'Dfyn CAS/WETH LP',
    symbol: 'DLP',
    decimals: 18,
    type: 'lp-token',
  },
];

/**
 * Tokens da Polygon Amoy Testnet (chainId 80002).
 * @type {Array<{ address: string, name: string, symbol: string, decimals: number, type: string }>}
 */
export const TESTNET_TOKENS = [
  {
    address: '0xD883D46079352316f92C23f13f3A19319A7B3301',
    name: 'Criptocoin Agentic Space',
    symbol: 'CAS',
    decimals: 18,
    type: 'token',
  },
  {
    address: '0x23222C45505576AC35A5f28458D02d8E715E48A7',
    name: 'CAS Token V1',
    symbol: 'CAS',
    decimals: 18,
    type: 'token',
  },
  {
    address: '0x86fE62cb65C036412dC100035DeacD5A9345D86F',
    name: 'CAS Token V2',
    symbol: 'CAS',
    decimals: 18,
    type: 'token',
  },
  {
    address: '0xbedA5753f950c891d79a49f7c37182F0161c187C',
    name: 'CAS Fund Tracker (Amoy)',
    symbol: 'aCAS',
    decimals: 18,
    type: 'fund-tracker',
  },
  {
    address: '0x041055839123bd236010f4a4e663932F5C1167be',
    name: 'POL Fund Tracker (Amoy)',
    symbol: 'aPOL',
    decimals: 18,
    type: 'fund-tracker',
  },
];

/**
 * Busca um token pelo endereço em qualquer rede.
 * @param {string} address Endereço do contrato.
 * @param {number} [chainId] Se informado, busca apenas na rede especificada.
 * @returns {{ address: string, name: string, symbol: string, decimals: number, type: string, chainId: number } | null}
 */
export function findTokenByAddress(address, chainId) {
  const addr = address.toLowerCase();
  const search = (tokens, networkChainId) =>
    tokens.find((t) => t.address.toLowerCase() === addr);

  if (chainId === POLYGON_MAINNET_CHAIN_ID) {
    return search(MAINNET_TOKENS, chainId);
  }
  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    return search(TESTNET_TOKENS, chainId);
  }

  return (
    search(MAINNET_TOKENS, POLYGON_MAINNET_CHAIN_ID) ||
    search(TESTNET_TOKENS, POLYGON_AMOY_CHAIN_ID)
  );
}

/**
 * Retorna todos os tokens de uma rede.
 * @param {number} chainId
 * @returns {Array}
 */
export function getTokensByChainId(chainId) {
  if (chainId === POLYGON_MAINNET_CHAIN_ID) return MAINNET_TOKENS;
  if (chainId === POLYGON_AMOY_CHAIN_ID) return TESTNET_TOKENS;
  return [];
}
