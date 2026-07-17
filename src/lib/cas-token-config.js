/**
 * @file cas-token-config.js
 * @description Configuração centralizada do CAS Token para a página institucional.
 *              Contém endereços de contrato na Polygon mainnet, ABIs mínimas
 *              para leitura de dados on-chain, e dados estáticos do modelo
 *              de escalonamento de preço por fases.
 *
 * Padrão: Registry (configuração imutável de constantes de protocolo)
 */

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_RPC = 'https://polygon-rpc.com';

export const CAS_TOKEN_ADDRESS = '0x5151A34EaC7bA08cd6B540b32cD30316218A2287';
export const CASSWAP_ADDRESS = '0x9399878Ce33EA9D4859ab708a111fB3f274BACF4';
export const DIAMOND_ADDRESS = '0x80BD976cB588cD2F9aD9Ac671FB19174E9F3172b';
export const INFRA_FUND_ADDRESS = '0x190A9D2f206dbeb72Ce8b88Dc2603745fB5f50dB';

export const EXPLORER_BASE = 'https://polygonscan.com';

export const CASSWAP_READ_ABI = [
  'function getRatio() external view returns (uint256 numerator, uint256 denominator)',
  'function swapFeeBps() external view returns (uint256)',
  'function getCasBalance() external view returns (uint256)',
  'function getPolBalance() external view returns (uint256)',
];

export const CAS_TOKEN_READ_ABI = [
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

export const DIAMOND_READ_ABI = [
  'function getFees() external view returns (tuple(uint256 registrationFee, uint256 validationFee, uint256 daoProposalFee, uint256 userRegistrationFee))',
];

export const DEFAULT_RATIO = { numerator: 2, denominator: 1 };
export const MAX_SUPPLY = 10_000_000;
export const INITIAL_SUPPLY = 1_000_000;

export const PRICE_PHASES = [
  { phase: 0, users: '< 50', agents: '< 20', casPricePol: 0.5, usdApprox: 0.0375, marketCap: 37500 },
  { phase: 1, users: '≥ 50', agents: '≥ 30', casPricePol: 0.75, usdApprox: 0.056, marketCap: 56250 },
  { phase: 2, users: '≥ 200', agents: '≥ 100', casPricePol: 1.0, usdApprox: 0.075, marketCap: 75000 },
  { phase: 3, users: '≥ 500', agents: '≥ 250', casPricePol: 1.5, usdApprox: 0.112, marketCap: 112500 },
  { phase: 4, users: '≥ 1.000', agents: '≥ 500', casPricePol: 2.5, usdApprox: 0.187, marketCap: 187500 },
  { phase: 5, users: '≥ 5.000', agents: '≥ 2.000', casPricePol: 5.0, usdApprox: 0.375, marketCap: 375000 },
  { phase: 6, users: '≥ 10.000', agents: '≥ 5.000', casPricePol: 10.0, usdApprox: 0.75, marketCap: 750000 },
  { phase: 7, users: '≥ 50.000', agents: '≥ 20.000', casPricePol: 25.0, usdApprox: 1.875, marketCap: 1875000 },
  { phase: 8, users: '≥ 100.000', agents: '≥ 50.000', casPricePol: 50.0, usdApprox: 3.75, marketCap: 3750000 },
];

export const DEFAULT_OPERATIONAL_FEES = [
  { operation: 'userRegistration', fee: 1, contractField: 'userRegistrationFee' },
  { operation: 'agentRegistration', fee: 100, contractField: 'registrationFee' },
  { operation: 'agentValidation', fee: 10, contractField: 'validationFee' },
  { operation: 'daoProposal', fee: 50, contractField: 'daoProposalFee' },
];

export const COINGECKO_MULTI_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd,brl,eur&include_24hr_change=true';

export const LOCALE_CURRENCY_MAP = {
  pt: 'BRL',
  en: 'USD',
  fr: 'EUR',
};

export const CURRENCY_SYMBOLS = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_LOCALE_MAP = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'fr-FR',
};

export const FEES_CACHE_KEY = 'agentic_space_fees_cache';
export const FEES_CACHE_TTL_MS = 60_000;
