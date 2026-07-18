'use client';

import { ethers } from 'ethers';
import { apiRequest } from '@/lib/api';

export const CERTIFICATE_SCHEMA = 'https://agenticspace.rapport.tec.br/schemas/certificate-v1';
export const CERTIFICATE_DOMAIN = { name: 'RapportCertificate', version: '1' };
export const ISSUER = Object.freeze({
  legalName: 'Raport Tecnologia Inova Simples',
  cnpj: '67.904.299/0001-80',
  website: 'https://rapport.tec.br',
  agenticSpaceWebsite: 'https://agenticspace.rapport.tec.br',
});

export const CERTIFICATE_ABI = [
  'function currentPhaseId() view returns (uint256)',
  'function phaseCount() view returns (uint256)',
  'function casToken() view returns (address)',
  'function certificateOf(address recipient, uint256 phaseId) view returns (uint256)',
  'function tokenBoundAccount(uint256 tokenId) view returns (address)',
  'function nonces(address recipient) view returns (uint256)',
  'function getPhase(uint256 phaseId) view returns (tuple(string name, bytes32 templateHash, uint256 minCasDeposit, uint256 startsAt, uint256 endsAt, uint256 minted, bool active))',
  'function getCertificate(uint256 tokenId) view returns (tuple(uint256 phaseId, address recipient, address tokenBoundAccount, bytes32 issuanceId, bytes32 nameHash, bytes32 metadataHash, uint256 casDeposited, uint256 issuedAt, bool revoked, bytes32 revocationReasonHash, uint256 revokedAt, bytes32 documentHash))',
  'function mintCertificate((bytes32 issuanceId, address recipient, bytes32 nameHash, uint256 phaseId, bytes32 metadataHash, uint256 casAmount, uint256 nonce, uint256 deadline) auth, address issuer, bytes signature) returns (uint256 tokenId, address tokenBoundAccount_)',
  'function depositCasForMint(uint256 phaseId)',
  'function withdrawCasDeposit(uint256 phaseId)',
  'function casDepositBalance(address recipient, uint256 phaseId) view returns (uint256)',
  'function verifyCertificate(uint256 tokenId) view returns (bool valid, address recipient, uint256 phaseId, address account, uint256 currentCasBalance, bytes32 metadataHash, bytes32 documentHash)',
  'function verifyDocument(bytes32 documentHash) view returns (bool valid, uint256 tokenId)',
  'event CertificateMinted(uint256 indexed tokenId, uint256 indexed phaseId, address indexed recipient, address tokenBoundAccount, bytes32 issuanceId, bytes32 nameHash, bytes32 metadataHash, uint256 casAmount)',
  'event CasDeposited(address indexed recipient, uint256 indexed phaseId, uint256 amount, uint256 newBalance)',
];

export const DIAMOND_CERTIFICATE_ABI = [
  'function depositAndMintCertificate((bytes32 issuanceId, address recipient, bytes32 nameHash, uint256 phaseId, bytes32 metadataHash, uint256 casAmount, uint256 nonce, uint256 deadline) auth, address issuer, bytes signature) returns (uint256 tokenId, address tokenBoundAccount_)',
  'function getCertificateContract() view returns (address)',
];

export const CAS_CERTIFICATE_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const FALLBACK_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CERTIFICATE_CHAIN_ID || 137);
const FALLBACK_CERTIFICATE_ADDRESS = process.env.NEXT_PUBLIC_CERTIFICATE_ADDRESS || '';
const FALLBACK_DIAMOND_ADDRESS = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS || '';
const FALLBACK_CAS_ADDRESS =
  process.env.NEXT_PUBLIC_CAS_TOKEN_ADDRESS || '0x5151A34EaC7bA08cd6B540b32cD30316218A2287';
const FALLBACK_SWAP_ADDRESS =
  process.env.NEXT_PUBLIC_CAS_SWAP_ADDRESS || '0x9399878Ce33EA9D4859ab708a111fB3f274BACF4';
const FALLBACK_RPC = process.env.NEXT_PUBLIC_CERTIFICATE_RPC_URL || 'https://polygon-rpc.com';
const FALLBACK_EXPLORER = process.env.NEXT_PUBLIC_CERTIFICATE_EXPLORER_URL || 'https://polygonscan.com';
const FALLBACK_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://agenticspace.rapport.tec.br';

export function normalizeCertificateName(value) {
  // Deve permanecer identico a normalizeCertificateHolderName() no backend,
  // pois o hash EIP-712 e sensivel a cada code point.
  return String(value || '').normalize('NFC').trim().replace(/\s+/gu, ' ');
}

export function hashCertificateName(value, salt = '') {
  const normalized = normalizeCertificateName(value);
  if (!normalized) return ethers.ZeroHash;
  const salted = ethers.isAddress(salt)
    ? `${normalized}:${ethers.getAddress(salt).toLowerCase()}`
    : normalized;
  return ethers.keccak256(ethers.toUtf8Bytes(salted));
}

export function formatCasAmount(value, maximumFractionDigits = 2) {
  try {
    return `${Number(ethers.formatUnits(BigInt(value || 0), 18)).toLocaleString('pt-BR', {
      maximumFractionDigits,
    })} CAS`;
  } catch {
    return '0 CAS';
  }
}

export function compactHash(value, left = 8, right = 6) {
  if (!value) return '—';
  const text = String(value);
  return text.length > left + right + 3
    ? `${text.slice(0, left)}…${text.slice(-right)}`
    : text;
}

export function getFallbackCertificateConfig() {
  return {
    enabled: ethers.isAddress(FALLBACK_CERTIFICATE_ADDRESS),
    chainId: FALLBACK_CHAIN_ID,
    certificateAddress: FALLBACK_CERTIFICATE_ADDRESS,
    diamondAddress: FALLBACK_DIAMOND_ADDRESS,
    casTokenAddress: FALLBACK_CAS_ADDRESS,
    casSwapAddress: FALLBACK_SWAP_ADDRESS,
    rpcUrl: FALLBACK_RPC,
    explorerUrl: FALLBACK_EXPLORER,
    siteUrl: FALLBACK_SITE_URL,
    issuerAddress: '',
  };
}

function normalizeConfig(data = {}) {
  const fallback = getFallbackCertificateConfig();
  const source = data.config || data;
  const certificateAddress =
    source.certificateAddress || source.contractAddress || fallback.certificateAddress;
  return {
    ...fallback,
    ...source,
    enabled: Boolean(source.enabled ?? ethers.isAddress(certificateAddress)),
    chainId: Number(source.chainId || fallback.chainId),
    certificateAddress,
    diamondAddress: source.diamondAddress || fallback.diamondAddress,
    casTokenAddress: source.casTokenAddress || fallback.casTokenAddress,
    casSwapAddress: source.casSwapAddress || fallback.casSwapAddress,
    rpcUrl: source.rpcUrl || fallback.rpcUrl,
    explorerUrl: source.explorerUrl || fallback.explorerUrl,
    siteUrl: String(
      source.siteUrl || source.publicBaseUrl || source.frontendUrl || fallback.siteUrl
    ).replace(/\/$/, ''),
    issuerAddress: source.issuerAddress || '',
    currentPhase: source.currentPhase || null,
    unavailableReasons: Array.isArray(source.unavailableReasons) ? source.unavailableReasons : [],
    onchain: source.onchain || null,
  };
}

/** Configuracao publica; degrada para variaveis NEXT_PUBLIC quando a API nao estiver pronta. */
export async function loadCertificateConfig(jwt) {
  try {
    const { status, data } = await apiRequest('/certificates/config', { jwt });
    if (status < 400) return normalizeConfig(data);
  } catch {
    // O frontend estatico continua capaz de consultar a rede com configuracao publica.
  }
  return normalizeConfig();
}

export async function prepareCertificateMint(payload, jwt) {
  return apiRequest('/certificates/prepare', { method: 'POST', body: payload, jwt });
}

export async function autoPrepareCertificateMint(payload, jwt) {
  return apiRequest('/certificates/auto-prepare', { method: 'POST', body: payload, jwt });
}

export async function confirmCertificateMint(payload, jwt) {
  return apiRequest('/certificates/confirm', { method: 'POST', body: payload, jwt });
}

export async function listMyCertificateIssuances(jwt) {
  try {
    const response = await apiRequest('/certificates/mine', { jwt });
    if (response.status >= 400) return [];
    return Array.isArray(response.data?.certificates) ? response.data.certificates : [];
  } catch {
    return [];
  }
}

export function getCertificateContract(address, runner) {
  if (!ethers.isAddress(address)) throw new Error('Contrato de certificados nao configurado.');
  return new ethers.Contract(address, CERTIFICATE_ABI, runner);
}

export function getCasContract(address, runner) {
  if (!ethers.isAddress(address)) throw new Error('Contrato CAS nao configurado.');
  return new ethers.Contract(address, CAS_CERTIFICATE_ABI, runner);
}

export function getDiamondCertificateContract(address, runner) {
  if (!ethers.isAddress(address)) throw new Error('Diamond de certificados nao configurado.');
  return new ethers.Contract(address, DIAMOND_CERTIFICATE_ABI, runner);
}

export function phaseFromResult(result, phaseId) {
  return {
    id: String(phaseId),
    name: result.name,
    templateHash: result.templateHash,
    minCasDeposit: result.minCasDeposit.toString(),
    startsAt: result.startsAt.toString(),
    endsAt: result.endsAt.toString(),
    minted: result.minted.toString(),
    active: result.active,
  };
}

export function certificateFromResult(result, tokenId) {
  return {
    tokenId: String(tokenId),
    phaseId: result.phaseId.toString(),
    recipient: result.recipient,
    tokenBoundAccount: result.tokenBoundAccount,
    issuanceId: result.issuanceId,
    nameHash: result.nameHash,
    metadataHash: result.metadataHash,
    casDeposited: result.casDeposited.toString(),
    issuedAt: result.issuedAt.toString(),
    revoked: result.revoked,
    revocationReasonHash: result.revocationReasonHash,
    revokedAt: result.revokedAt.toString(),
    documentHash: result.documentHash,
  };
}

export async function readCertificateContext(config, recipient) {
  if (!ethers.isAddress(config.certificateAddress)) {
    return { phase: null, certificate: null, casBalance: '0', currentCasBalance: '0' };
  }
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  const contract = getCertificateContract(config.certificateAddress, provider);
  const phaseId = await contract.currentPhaseId();
  const phase = phaseId > 0n
    ? phaseFromResult(await contract.getPhase(phaseId), phaseId)
    : null;
  let certificate = null;
  let currentCasBalance = '0';
  if (phaseId > 0n && recipient && ethers.isAddress(recipient)) {
    const tokenId = await contract.certificateOf(recipient, phaseId);
    if (tokenId > 0n) {
      certificate = certificateFromResult(await contract.getCertificate(tokenId), tokenId);
      const verification = await contract.verifyCertificate(tokenId);
      currentCasBalance = verification.currentCasBalance.toString();
    }
  }
  const cas = getCasContract(config.casTokenAddress, provider);
  const casBalance = recipient && ethers.isAddress(recipient)
    ? (await cas.balanceOf(recipient)).toString()
    : '0';
  return { provider, contract, phase, certificate, casBalance, currentCasBalance };
}

export async function readCertificateByToken(config, tokenId) {
  if (!ethers.isAddress(config.certificateAddress)) {
    throw new Error('Contrato de certificados nao configurado.');
  }
  const numericTokenId = BigInt(tokenId || 0);
  if (numericTokenId <= 0n) throw new Error('Token ID invalido.');
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  const contract = getCertificateContract(config.certificateAddress, provider);
  const [rawCertificate, verification] = await Promise.all([
    contract.getCertificate(numericTokenId),
    contract.verifyCertificate(numericTokenId),
  ]);
  const certificate = certificateFromResult(rawCertificate, numericTokenId);
  const phase = phaseFromResult(
    await contract.getPhase(certificate.phaseId),
    certificate.phaseId
  );
  return {
    certificate,
    phase,
    currentCasBalance: verification.currentCasBalance.toString(),
  };
}

export function buildVerificationUrl(config, tokenId) {
  const query = new URLSearchParams({
    chain: String(config.chainId),
    contract: config.certificateAddress,
    token: String(tokenId),
  });
  return `${config.siteUrl}/certificado/verificar?${query.toString()}`;
}

export function buildCertificateManifest({ config, phase, certificate, recipientName, txHash = '' }) {
  const normalizedName = normalizeCertificateName(recipientName);
  return {
    schema: CERTIFICATE_SCHEMA,
    version: 1,
    issuer: ISSUER,
    certificate: {
      tokenId: certificate.tokenId,
      phaseId: certificate.phaseId,
      phaseTitle: phase.name,
      recipientName: normalizedName,
      recipient: certificate.recipient,
      nameHash: certificate.nameHash,
      metadataHash: certificate.metadataHash,
      issuanceId: certificate.issuanceId,
      issuedAt: certificate.issuedAt,
      tokenBoundAccount: certificate.tokenBoundAccount,
      casDeposited: certificate.casDeposited,
      initialCasDepositFormatted: formatCasAmount(certificate.casDeposited),
      documentHash: certificate.documentHash,
      revoked: certificate.revoked,
    },
    blockchain: {
      chainId: config.chainId,
      contractAddress: config.certificateAddress,
      transactionHash: txHash,
      explorerUrl: config.explorerUrl,
    },
    verificationUrl: buildVerificationUrl(config, certificate.tokenId),
    generatedAt: new Date().toISOString(),
  };
}

export function buildDraftManifest({ config, phase, recipientName, recipient = '' }) {
  const normalizedName = normalizeCertificateName(recipientName) || 'Nome do Sócio Fundador';
  return {
    schema: CERTIFICATE_SCHEMA,
    version: 1,
    issuer: ISSUER,
    certificate: {
      tokenId: '0',
      phaseId: phase?.id || '1',
      phaseTitle: phase?.name || 'Sócio Fundador',
      recipientName: normalizedName,
      recipient: recipient || '—',
      nameHash: hashCertificateName(normalizedName, recipient),
      metadataHash: ethers.ZeroHash,
      issuanceId: ethers.ZeroHash,
      issuedAt: '0',
      tokenBoundAccount: '—',
      casDeposited: phase?.minCasDeposit || ethers.parseEther('50').toString(),
      initialCasDepositFormatted: formatCasAmount(
        phase?.minCasDeposit || ethers.parseEther('50').toString()
      ),
      documentHash: ethers.ZeroHash,
      revoked: false,
    },
    blockchain: {
      chainId: config?.chainId || FALLBACK_CHAIN_ID,
      contractAddress: config?.certificateAddress || '',
      transactionHash: '',
      explorerUrl: config?.explorerUrl || FALLBACK_EXPLORER,
    },
    verificationUrl: '',
    generatedAt: new Date(0).toISOString(),
  };
}

function equalAddress(left, right) {
  return ethers.isAddress(left) && ethers.isAddress(right) && left.toLowerCase() === right.toLowerCase();
}

function compareManifest(manifest, record, phase, verification) {
  const certificate = manifest.certificate;
  const checks = {
    schema: manifest.schema === CERTIFICATE_SCHEMA && manifest.version === 1,
    issuer:
      manifest.issuer?.legalName === ISSUER.legalName &&
      manifest.issuer?.cnpj === ISSUER.cnpj &&
      manifest.issuer?.website === ISSUER.website &&
      manifest.issuer?.agenticSpaceWebsite === ISSUER.agenticSpaceWebsite,
    issuance: certificate.issuanceId === record.issuanceId,
    recipientName: hashCertificateName(certificate.recipientName, record.recipient) === record.nameHash,
    recipient: equalAddress(certificate.recipient, record.recipient),
    phase: String(certificate.phaseId) === record.phaseId && certificate.phaseTitle === phase.name,
    metadata: certificate.metadataHash === record.metadataHash,
    account: equalAddress(certificate.tokenBoundAccount, record.tokenBoundAccount),
    deposit: String(certificate.casDeposited) === record.casDeposited,
    issuedAt: String(certificate.issuedAt) === record.issuedAt,
    notRevoked: !record.revoked,
    onchain: Boolean(verification.valid),
  };
  return checks;
}

/**
 * Confere o manifesto exclusivamente contra um endereco de contrato confiavel
 * vindo da configuracao local/API. Nunca usa RPC ou contrato sugeridos pelo PDF.
 */
export async function verifyCertificateManifest(manifest, suppliedConfig) {
  const config = normalizeConfig(suppliedConfig);
  if (!manifest || manifest.schema !== CERTIFICATE_SCHEMA || manifest.version !== 1) {
    throw new Error('Manifesto de certificado desconhecido.');
  }
  const manifestAddress = manifest.blockchain?.contractAddress;
  if (!ethers.isAddress(config.certificateAddress)) {
    throw new Error('O verificador ainda nao possui um contrato oficial configurado.');
  }
  if (!equalAddress(manifestAddress, config.certificateAddress)) {
    throw new Error('O PDF aponta para um contrato que nao pertence ao emissor oficial.');
  }
  if (Number(manifest.blockchain?.chainId) !== Number(config.chainId)) {
    throw new Error('A rede blockchain informada no PDF nao e a rede oficial configurada.');
  }

  const tokenId = BigInt(manifest.certificate?.tokenId || 0);
  if (tokenId <= 0n) throw new Error('Token ID ausente ou invalido.');
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  if ((await provider.getCode(config.certificateAddress)) === '0x') {
    throw new Error('O contrato oficial nao foi encontrado na rede configurada.');
  }
  const contract = getCertificateContract(config.certificateAddress, provider);

  let result;
  let rawRecord;
  try {
    [result, rawRecord] = await Promise.all([
      contract.verifyCertificate(tokenId),
      contract.getCertificate(tokenId),
    ]);
  } catch {
    throw new Error('O token informado nao existe no contrato oficial.');
  }
  const record = certificateFromResult(rawRecord, tokenId);
  const phase = phaseFromResult(await contract.getPhase(record.phaseId), record.phaseId);
  const verification = {
    valid: result.valid,
    recipient: result.recipient,
    phaseId: result.phaseId.toString(),
    account: result.account,
    currentCasBalance: result.currentCasBalance.toString(),
    metadataHash: result.metadataHash,
    documentHash: result.documentHash,
  };
  const checks = compareManifest(manifest, record, phase, verification);
  const valid = Object.values(checks).every(Boolean);
  return {
    valid,
    checks,
    config,
    phase,
    record,
    verification,
    currentCasBalanceFormatted: formatCasAmount(verification.currentCasBalance, 6),
  };
}

/** Consulta publica por token sem revelar nome civil (armazenado apenas como hash). */
export async function verifyCertificateReference({ chainId, contractAddress, tokenId }, suppliedConfig) {
  const config = normalizeConfig(suppliedConfig);
  if (Number(chainId) !== config.chainId || !equalAddress(contractAddress, config.certificateAddress)) {
    throw new Error('A referencia nao pertence ao contrato oficial configurado.');
  }
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  const contract = getCertificateContract(config.certificateAddress, provider);
  const [result, rawRecord] = await Promise.all([
    contract.verifyCertificate(tokenId),
    contract.getCertificate(tokenId),
  ]);
  const record = certificateFromResult(rawRecord, tokenId);
  const phase = phaseFromResult(await contract.getPhase(record.phaseId), record.phaseId);
  return {
    valid: Boolean(result.valid) && !record.revoked,
    config,
    phase,
    record,
    verification: {
      valid: result.valid,
      currentCasBalance: result.currentCasBalance.toString(),
      documentHash: result.documentHash,
    },
    currentCasBalanceFormatted: formatCasAmount(result.currentCasBalance.toString(), 6),
  };
}

export function parseCertificateMinted(receipt, contractInterface) {
  for (const log of receipt.logs || []) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed?.name === 'CertificateMinted') {
        return {
          tokenId: parsed.args.tokenId.toString(),
          phaseId: parsed.args.phaseId.toString(),
          recipient: parsed.args.recipient,
          tokenBoundAccount: parsed.args.tokenBoundAccount,
          issuanceId: parsed.args.issuanceId,
          nameHash: parsed.args.nameHash,
          metadataHash: parsed.args.metadataHash,
          casAmount: parsed.args.casAmount.toString(),
        };
      }
    } catch {
      // Logs de CAS/registry nao pertencem a esta interface.
    }
  }
  throw new Error('A transacao confirmou, mas o evento CertificateMinted nao foi encontrado.');
}
