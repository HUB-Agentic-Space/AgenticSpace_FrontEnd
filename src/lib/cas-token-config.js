/**
 * @file cas-token-config.js
 * @description Configuração centralizada do CAS Token para a página institucional.
 *              Contém endereços de contrato na Polygon mainnet, ABIs mínimas
 *              para leitura de dados on-chain, e constantes de protocolo.
 *
 * Padrão: Registry (configuração imutável de constantes de protocolo)
 */

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_RPC = 'https://polygon-rpc.com';

export const CAS_TOKEN_ADDRESS = '0x5151A34EaC7bA08cd6B540b32cD30316218A2287';
export const CASSWAP_ADDRESS = '0x9399878Ce33EA9D4859ab708a111fB3f274BACF4';
export const DIAMOND_ADDRESS = '0x80BD976cB588cD2F9aD9Ac671FB19174E9F3172b';
export const INFRA_FUND_ADDRESS = '0x190A9D2f206dbeb72Ce8b88Dc2603745fB5f50dB';
export const CERTIFICATE_ADDRESS = process.env.NEXT_PUBLIC_CERTIFICATE_ADDRESS || '';

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
  'function MAX_SUPPLY() external view returns (uint256)',
];

export const DIAMOND_READ_ABI = [
  'function getFees() external view returns (tuple(uint256 registrationFee, uint256 validationFee, uint256 daoProposalFee, uint256 userRegistrationFee))',
  'function getAllFeeTypes() external view returns (uint256[] feeTypes, uint256[] amounts)',
];

export const CERTIFICATE_READ_ABI = [
  'function currentPhaseId() view returns (uint256)',
  'function phaseCount() view returns (uint256)',
  'function getPhase(uint256 phaseId) view returns (tuple(string name, bytes32 templateHash, uint256 minCasDeposit, uint256 startsAt, uint256 endsAt, uint256 minted, bool active))',
];

export const DEFAULT_RATIO = { numerator: 2, denominator: 1 };
export const MAX_SUPPLY = 10_000_000;
export const INITIAL_SUPPLY = 1_000_000;

/**
 * Metadados dos quatro campos legados de getFees(). Os valores nunca ficam
 * definidos no frontend: são sempre lidos do Diamond.
 */
export const CORE_OPERATIONAL_FEES = [
  { feeType: '0', operation: 'agentRegistration', contractField: 'registrationFee' },
  { feeType: '1', operation: 'agentValidation', contractField: 'validationFee' },
  { feeType: '2', operation: 'daoProposal', contractField: 'daoProposalFee' },
  { feeType: '3', operation: 'userRegistration', contractField: 'userRegistrationFee' },
];

/**
 * Nomes semânticos conhecidos para compatibilidade com consumidores atuais.
 * Tipos futuros não precisam ser adicionados aqui para aparecer na listagem:
 * recebem automaticamente a operação `customFee:<id>`.
 */
export const KNOWN_CUSTOM_FEE_OPERATIONS = Object.freeze({
  4: 'daoAgendaSubmission',
  5: 'daoVoting',
  6: 'certificateIssuance',
});

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

export const FEES_CACHE_KEY = 'agentic_space_fees_cache_v2';
export const FEES_CACHE_TTL_MS = 60_000;
