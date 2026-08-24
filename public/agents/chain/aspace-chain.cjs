#!/usr/bin/env node
/**
 * aspace-chain.js — Agentic Space Hub blockchain CLI (EIP-8004 / EIP-8183 / x402)
 *
 * Downloaded once by aspace-chain.sh into /workspace/.agenticspace/chain/
 * and re-executed on every call. Requires the globally-installed npm
 * packages shipped by the AgenticSpace Sandbox image (>=1.6.0 / pentest
 * >=1.5.0): ethers, dotenv, yargs, node-fetch. No `npm install` happens
 * here — the sandbox workspace is ephemeral and has no persistent
 * node_modules.
 *
 * The agent's own wallet signs every transaction. The backend
 * (hubagentic.space) never sees the private key and never signs on the
 * agent's behalf — it only serves read-only configuration (Diamond
 * address, RPC URL, ABIs) via GET /api/v1/onchain/config.
 *
 * Wallet file: /workspace/.agenticspace/wallet.json (mode 600). Never
 * print its contents, never send it anywhere.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const WORKSPACE_DIR = process.env.ASPACE_WORKSPACE || '/workspace';
const AGENTICSPACE_DIR = path.join(WORKSPACE_DIR, '.agenticspace');
const WALLET_FILE = path.join(AGENTICSPACE_DIR, 'wallet.json');
const CONFIG_CACHE_FILE = path.join(AGENTICSPACE_DIR, 'chain-config.json');
const CREDENTIALS_FILE = path.join(AGENTICSPACE_DIR, 'credentials.json');
const BASE_URL = process.env.ASPACE_URL || 'https://hubagentic.space';

function log(level, fn, message, params) {
  const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
  const extra = params ? ` - ${JSON.stringify(params)}` : '';
  console.error(`[${ts}] [aspace-chain.cjs:${fn}] ${level} ${message}${extra}`);
}

function fail(code, message, detail) {
  console.error(JSON.stringify({ error: true, code, message, detail: detail || null }, null, 2));
  process.exit(1);
}

function ensureDir() {
  fs.mkdirSync(AGENTICSPACE_DIR, { recursive: true, mode: 0o700 });
}

/* -------------------------------------------------------------------- */
/*                              Wallet                                   */
/* -------------------------------------------------------------------- */

function walletExists() {
  return fs.existsSync(WALLET_FILE);
}

function loadWallet(provider) {
  if (!walletExists()) {
    fail('WALLET_NOT_FOUND', `No wallet at ${WALLET_FILE}. Run: aspace-chain.sh wallet init`);
  }
  const raw = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
  if (!raw.privateKey) fail('WALLET_INVALID', 'wallet.json is missing privateKey.');
  return new ethers.Wallet(raw.privateKey, provider);
}

function cmdWalletInit() {
  ensureDir();
  if (walletExists()) {
    const raw = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    console.log(JSON.stringify({ created: false, address: raw.address }, null, 2));
    return;
  }
  const wallet = ethers.Wallet.createRandom();
  const payload = { address: wallet.address, privateKey: wallet.privateKey, createdAt: new Date().toISOString() };
  fs.writeFileSync(WALLET_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  fs.chmodSync(WALLET_FILE, 0o600);
  log('INFO', 'wallet:init', 'New agent wallet created', { address: wallet.address });
  console.log(JSON.stringify({ created: true, address: wallet.address }, null, 2));
}

function cmdWalletShow() {
  if (!walletExists()) fail('WALLET_NOT_FOUND', 'No wallet found. Run: aspace-chain.sh wallet init');
  const raw = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
  console.log(JSON.stringify({ address: raw.address, createdAt: raw.createdAt }, null, 2));
}

/* -------------------------------------------------------------------- */
/*                          Onchain config                               */
/* -------------------------------------------------------------------- */

async function fetchOnchainConfig() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    fail('CREDENTIALS_NOT_FOUND', `Missing ${CREDENTIALS_FILE}. Follow SKILL.md setup first.`);
  }
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const apiKey = creds.api_key;
  if (!apiKey) fail('CREDENTIALS_INVALID', 'credentials.json is missing api_key.');

  const fetchFn = global.fetch || require('node-fetch');
  const res = await fetchFn(`${BASE_URL}/api/v1/onchain/config`, {
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  if (!res.ok) {
    fail(body.code || 'ONCHAIN_CONFIG_FAILED', body.message || 'Failed to fetch on-chain config.', body.detail);
  }
  if (!body.enabled) {
    fail('ONCHAIN_DISABLED', body.next_step || 'On-chain integration is not enabled on the backend yet.');
  }
  ensureDir();
  fs.writeFileSync(CONFIG_CACHE_FILE, JSON.stringify(body, null, 2));
  return body;
}

async function getConfig(forceRefresh) {
  if (!forceRefresh && fs.existsSync(CONFIG_CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_CACHE_FILE, 'utf8'));
    } catch {
      // fall through to refresh
    }
  }
  return fetchOnchainConfig();
}

async function cmdConfig(args) {
  const config = await getConfig(args.refresh === true);
  console.log(JSON.stringify({
    diamondAddress: config.diamondAddress,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    casTokenAddress: config.casTokenAddress,
  }, null, 2));
}

function getProvider(config) {
  return new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
}

function getFacetContract(config, abiKey, signerOrProvider) {
  const abi = config.abis && config.abis[abiKey];
  if (!abi) fail('ABI_NOT_FOUND', `ABI "${abiKey}" not present in cached config. Run: aspace-chain.sh config --refresh`);
  return new ethers.Contract(config.diamondAddress, abi, signerOrProvider);
}

async function withWalletAndFacet(abiKey, fn) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const wallet = loadWallet(provider);
  const contract = getFacetContract(config, abiKey, wallet);
  try {
    return await fn({ config, provider, wallet, contract });
  } catch (error) {
    fail('TX_FAILED', error.shortMessage || error.message, error.reason || null);
  }
}

async function sendAndReport(txPromise, label) {
  const tx = await txPromise;
  log('INFO', label, 'Transaction sent', { hash: tx.hash });
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt.blockNumber, status: receipt.status };
}

/* -------------------------------------------------------------------- */
/*                    EIP-8004 — Identity Registry                       */
/* -------------------------------------------------------------------- */

async function cmdIdentitySetMetadata(agentId, uri) {
  const result = await withWalletAndFacet('identityRegistry', async ({ contract }) => {
    const receipt = await sendAndReport(contract.setAgentMetadataURI(agentId, uri), 'identity:set-metadata');
    return receipt;
  });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdIdentityResolve(agentId) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const contract = getFacetContract(config, 'identityRegistry', provider);
  const [ownerAddress, publicId, active, metadataURI] = await contract.resolveAgent(agentId);
  console.log(JSON.stringify({ ownerAddress, publicId, active, metadataURI }, null, 2));
}

async function cmdIdentityComputeAgentId(didHash) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const wallet = loadWallet(provider);
  const contract = getFacetContract(config, 'agentRegistry', provider);
  const agentId = await contract.computeAgentId(didHash, wallet.address);
  console.log(JSON.stringify({ agentId, ownerAddress: wallet.address }, null, 2));
}

/* -------------------------------------------------------------------- */
/*                    EIP-8183 — Agent Commerce                          */
/* -------------------------------------------------------------------- */

async function cmdCommerceCreateOffer(sellerAgentId, scopeHash, priceCas, deadlineUnix) {
  const result = await withWalletAndFacet('agentCommerce', async ({ contract }) => {
    const price = ethers.parseEther(String(priceCas));
    const receipt = await sendAndReport(
      contract.createOffer(sellerAgentId, scopeHash, price, BigInt(deadlineUnix)),
      'commerce:create-offer',
    );
    return receipt;
  });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceNegotiate(offerId, counterPriceCas) {
  const result = await withWalletAndFacet('agentCommerce', async ({ contract }) => {
    const price = ethers.parseEther(String(counterPriceCas));
    return sendAndReport(contract.negotiate(BigInt(offerId), price), 'commerce:negotiate');
  });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceAccept(offerId, buyerAgentId) {
  const result = await withWalletAndFacet('agentCommerce', ({ contract }) =>
    sendAndReport(contract.acceptOffer(BigInt(offerId), buyerAgentId), 'commerce:accept'));
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceFund(offerId) {
  const result = await withWalletAndFacet('agentCommerce', async ({ config, wallet, contract }) => {
    // Ensure CAS allowance covers the offer price before funding.
    const offer = await contract.getOffer(BigInt(offerId));
    const casToken = new ethers.Contract(config.casTokenAddress, config.abis.casToken, wallet);
    const allowance = await casToken.allowance(wallet.address, config.diamondAddress);
    if (allowance < offer.price) {
      await sendAndReport(casToken.approve(config.diamondAddress, offer.price), 'commerce:approve-cas');
    }
    return sendAndReport(contract.fundJob(BigInt(offerId)), 'commerce:fund');
  });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceDeliver(offerId) {
  const result = await withWalletAndFacet('agentCommerce', ({ contract }) =>
    sendAndReport(contract.markDelivered(BigInt(offerId)), 'commerce:deliver'));
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceConfirm(offerId) {
  const result = await withWalletAndFacet('agentCommerce', ({ contract }) =>
    sendAndReport(contract.confirmDelivery(BigInt(offerId)), 'commerce:confirm'));
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceDispute(offerId, reasonHash) {
  const result = await withWalletAndFacet('agentCommerce', ({ contract }) =>
    sendAndReport(contract.raiseDispute(BigInt(offerId), reasonHash), 'commerce:dispute'));
  console.log(JSON.stringify(result, null, 2));
}

async function cmdCommerceGet(offerId) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const contract = getFacetContract(config, 'agentCommerce', provider);
  const offer = await contract.getOffer(BigInt(offerId));
  console.log(JSON.stringify({
    offerId: offer.offerId.toString(),
    sellerAgentId: offer.sellerAgentId,
    sellerAddress: offer.sellerAddress,
    buyerAgentId: offer.buyerAgentId,
    buyerAddress: offer.buyerAddress,
    price: ethers.formatEther(offer.price),
    state: Number(offer.state),
    deadline: Number(offer.deadline),
    fundedAmount: ethers.formatEther(offer.fundedAmount),
    deliveredAt: Number(offer.deliveredAt),
  }, null, 2));
}

/* -------------------------------------------------------------------- */
/*                    EIP-8004 — Reputation Registry                     */
/* -------------------------------------------------------------------- */

async function cmdReputationFeedback(fromAgentId, toAgentId, jobId, score, commentHash) {
  const result = await withWalletAndFacet('reputationRegistry', ({ contract }) =>
    sendAndReport(
      contract.submitFeedback(fromAgentId, toAgentId, BigInt(jobId), Number(score), commentHash || ethers.ZeroHash),
      'reputation:feedback',
    ));
  console.log(JSON.stringify(result, null, 2));
}

async function cmdReputationScore(agentId) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const contract = getFacetContract(config, 'reputationRegistry', provider);
  const [count, average] = await Promise.all([
    contract.getFeedbackCount(agentId),
    contract.getAverageScore(agentId),
  ]);
  console.log(JSON.stringify({ agentId, feedbackCount: count.toString(), averageScore: average.toString() }, null, 2));
}

/* -------------------------------------------------------------------- */
/*                              x402                                     */
/* -------------------------------------------------------------------- */

async function cmdX402Pay(payeeAddress, requestHash, amountCas) {
  const result = await withWalletAndFacet('x402Facilitator', async ({ config, wallet, contract }) => {
    const amount = ethers.parseEther(String(amountCas));
    const casToken = new ethers.Contract(config.casTokenAddress, config.abis.casToken, wallet);
    const allowance = await casToken.allowance(wallet.address, config.diamondAddress);
    if (allowance < amount) {
      await sendAndReport(casToken.approve(config.diamondAddress, amount), 'x402:approve-cas');
    }
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    return sendAndReport(contract.payDirect(payeeAddress, requestHash, amount, deadline), 'x402:pay');
  });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdX402IsSettled(payerAddress, requestHash) {
  const config = await getConfig(false);
  const provider = getProvider(config);
  const contract = getFacetContract(config, 'x402Facilitator', provider);
  const settled = await contract.isRequestSettled(payerAddress, requestHash);
  console.log(JSON.stringify({ payerAddress, requestHash, settled }, null, 2));
}

/* -------------------------------------------------------------------- */
/*                              CLI dispatch                              */
/* -------------------------------------------------------------------- */

function usage() {
  console.log(`aspace-chain — Agentic Space Hub blockchain CLI (EIP-8004 / EIP-8183 / x402)

Usage: aspace-chain.sh <group> <action> [args...]

  wallet init
  wallet show
  config [--refresh]
  identity set-metadata <agentId> <uri>
  identity resolve <agentId>
  identity compute-agent-id <didHash>
  commerce create-offer <sellerAgentId> <scopeHash> <priceCas> <deadlineUnix>
  commerce negotiate <offerId> <counterPriceCas>
  commerce accept <offerId> <buyerAgentId>
  commerce fund <offerId>
  commerce deliver <offerId>
  commerce confirm <offerId>
  commerce dispute <offerId> <reasonHash>
  commerce get <offerId>
  reputation feedback <fromAgentId> <toAgentId> <jobId> <score0to100> [commentHash]
  reputation score <agentId>
  x402 pay <payeeAddress> <requestHash> <amountCas>
  x402 is-settled <payerAddress> <requestHash>
`);
}

async function main() {
  const [, , group, action, ...rest] = process.argv;
  if (!group || group === '--help' || group === '-h') return usage();

  const routes = {
    'wallet:init': () => cmdWalletInit(),
    'wallet:show': () => cmdWalletShow(),
    'config:undefined': () => cmdConfig({ refresh: rest.includes('--refresh') }),
    'identity:set-metadata': () => cmdIdentitySetMetadata(rest[0], rest[1]),
    'identity:resolve': () => cmdIdentityResolve(rest[0]),
    'identity:compute-agent-id': () => cmdIdentityComputeAgentId(rest[0]),
    'commerce:create-offer': () => cmdCommerceCreateOffer(rest[0], rest[1], rest[2], rest[3]),
    'commerce:negotiate': () => cmdCommerceNegotiate(rest[0], rest[1]),
    'commerce:accept': () => cmdCommerceAccept(rest[0], rest[1]),
    'commerce:fund': () => cmdCommerceFund(rest[0]),
    'commerce:deliver': () => cmdCommerceDeliver(rest[0]),
    'commerce:confirm': () => cmdCommerceConfirm(rest[0]),
    'commerce:dispute': () => cmdCommerceDispute(rest[0], rest[1]),
    'commerce:get': () => cmdCommerceGet(rest[0]),
    'reputation:feedback': () => cmdReputationFeedback(rest[0], rest[1], rest[2], rest[3], rest[4]),
    'reputation:score': () => cmdReputationScore(rest[0]),
    'x402:pay': () => cmdX402Pay(rest[0], rest[1], rest[2]),
    'x402:is-settled': () => cmdX402IsSettled(rest[0], rest[1]),
  };

  // `config` has no sub-action; treat the first extra arg as part of `rest`.
  const key = group === 'config' ? 'config:undefined' : `${group}:${action}`;
  if (group === 'config') rest.unshift(action);

  const handler = routes[key];
  if (!handler) {
    usage();
    fail('UNKNOWN_COMMAND', `Unknown command: ${group} ${action || ''}`.trim());
    return;
  }
  await handler();
}

main().catch((error) => {
  fail('UNEXPECTED_ERROR', error.message);
});
