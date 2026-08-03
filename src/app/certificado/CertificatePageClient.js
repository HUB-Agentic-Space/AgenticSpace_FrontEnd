'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Coins,
  Download,
  ExternalLink,
  FileCheck2,
  Fuel,
  Info,
  Landmark,
  Linkedin,
  LockKeyhole,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import Spinner from '@/components/Spinner';
import MarkdownContent from '@/components/MarkdownContent';
import CASSwapModal from '@/components/CASSwapModal';
import WalletErrorModal from '@/components/WalletErrorModal';
import CertificateSvg from '@/components/certificates/CertificateSvg';
import { DIAMOND_READ_ABI } from '@/lib/cas-token-config';
import { useAuth } from '@/lib/auth-context';
import { getProfile, listLinkedAccounts } from '@/lib/api';
import { useWallet } from '@/lib/wallet/useWallet';
import { parseWalletError } from '@/lib/wallet/walletErrorHandler';
import {
  buildCertificateManifest,
  buildDraftManifest,
  compactHash,
  confirmCertificateMint,
  estimateMintGasCost,
  formatCasAmount,
  formatPolAmount,
  formatPolCost,
  getCasContract,
  getCertificateContract,
  getDiamondCertificateContract,
  hashCertificateName,
  listMyCertificateIssuances,
  loadChallenges,
  requestChallengeCertificate,
  listMyIssuanceRequests,
  loadCertificateConfig,
  normalizeCertificateName,
  parseCertificateMinted,
  prepareCertificateMint,
  readCertificateByToken,
  readCertificateContext,
} from '@/lib/certificates';
import {
  downloadCertificatePdf,
  downloadCertificateSvg,
  downloadChallengeInstructionsPdf,
} from '@/lib/certificate-pdf';

const DEFAULT_PHASE = {
  id: '1',
  name: 'Sócio Fundador',
  minCasDeposit: ethers.parseEther('50').toString(),
  active: true,
  minted: '0',
};

function walletError(error, context) {
  const parsed = parseWalletError(error, context);
  return parsed.message;
}

function normalizeAuthorization(value) {
  const auth = value?.authorization || value?.auth || value;
  if (!auth) throw new Error('O backend nao retornou a autorizacao de emissao.');
  return {
    issuanceId: auth.issuanceId,
    recipient: auth.recipient,
    nameHash: auth.nameHash,
    phaseId: String(auth.phaseId),
    metadataHash: auth.metadataHash,
    casAmount: String(auth.casAmount),
    nonce: String(auth.nonce),
    deadline: String(auth.deadline),
  };
}

function CertificateContent() {
  const { session } = useAuth();
  const {
    account,
    chainId,
    connect,
    getProvider,
    isConnecting,
    switchChain,
  } = useWallet({ chains: [137, 80002] });
  const artworkRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [phase, setPhase] = useState(DEFAULT_PHASE);
  const [profileName, setProfileName] = useState('');
  const [currentCertificate, setCurrentCertificate] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [certificatePhase, setCertificatePhase] = useState(null);
  const [certificateHistory, setCertificateHistory] = useState([]);
  const [casBalance, setCasBalance] = useState('0');
  const [polBalance, setPolBalance] = useState('0');
  const [gasEstimate, setGasEstimate] = useState(null);
  const [currentPhaseCasBalance, setCurrentPhaseCasBalance] = useState('0');
  const [currentCasBalance, setCurrentCasBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [exporting, setExporting] = useState('');
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastTxHash, setLastTxHash] = useState('');
  const [showSwap, setShowSwap] = useState(false);
  const [walletErrorObj, setWalletErrorObj] = useState(null);
  const [linkedWalletAddress, setLinkedWalletAddress] = useState(null);
  const [linkedAccountsList, setLinkedAccountsList] = useState([]);
  const [accountsChecked, setAccountsChecked] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [certificatePage, setCertificatePage] = useState('front');
  const [issuanceRequests, setIssuanceRequests] = useState([]);
  const [extraFeeAmount, setExtraFeeAmount] = useState(null);
  const [extraFeeLoading, setExtraFeeLoading] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);

  const loadCertificates = useCallback(async (activeConfig, recipient, jwt) => {
    if (!ethers.isAddress(activeConfig?.certificateAddress || '')) return;
    const [contextResult, issuances] = await Promise.allSettled([
      readCertificateContext(activeConfig, recipient),
      listMyCertificateIssuances(jwt),
    ]);
    const context = contextResult.status === 'fulfilled' ? contextResult.value : null;
    const issuanceList = issuances.status === 'fulfilled' ? issuances.value : [];

    if (context?.phase) {
      setPhase(context.phase);
    } else if (!context) {
      // RPC falhou — manter a fase do config carregado, não zerar
    } else {
      setPhase((previous) => ({ ...previous, id: '0', active: false, minted: '0' }));
    }
    if (context) {
      setCurrentCertificate(context.certificate);
      setCurrentPhaseCasBalance(context.currentCasBalance);
      setCasBalance(context.casBalance);
    }
    const confirmed = issuanceList.filter(
      (issuance) => issuance.status === 'confirmed' && issuance.token?.tokenId
    );
    setCertificateHistory(confirmed);

    if (context?.certificate) {
      setCertificate(context.certificate);
      setCertificatePhase(context.phase);
      setCurrentCasBalance(context.currentCasBalance);
      return;
    }

    const latest = confirmed[0];
    if (latest?.token?.tokenId) {
      try {
        const historical = await readCertificateByToken(activeConfig, latest.token.tokenId);
        setCertificate(historical.certificate);
        setCertificatePhase(historical.phase);
        setCurrentCertificate(historical.certificate);
        setCurrentCasBalance(historical.currentCasBalance);
        setLastTxHash(latest.transaction?.txHash || '');
      } catch {
        // Falha ao ler token on-chain — ainda exibir dados da API
        const fallbackCertificate = {
          tokenId: String(latest.token.tokenId),
          phaseId: latest.phase?.id || '0',
          recipient: latest.holder?.wallet || '',
          tokenBoundAccount: latest.token?.tokenBoundAccount || '',
          issuanceId: latest.issuanceId,
          nameHash: latest.holder?.nameHash || ethers.ZeroHash,
          metadataHash: latest.metadataHash || ethers.ZeroHash,
          casDeposited: String(latest.reserve?.amount || '0'),
          issuedAt: latest.issuedAt ? String(Math.floor(new Date(latest.issuedAt).getTime() / 1000)) : String(Math.floor(Date.now() / 1000)),
          revoked: false,
          revocationReasonHash: ethers.ZeroHash,
          revokedAt: '0',
          documentHash: ethers.ZeroHash,
        };
        const fallbackPhase = {
          ...phase,
          id: latest.phase?.id || phase.id,
          name: latest.phase?.name || phase.name,
          certificateType: latest.phase?.certificateType || latest.phase?.name || phase.certificateType,
          achievementSummary: latest.phase?.achievementSummary || phase.achievementSummary,
        };
        setCertificate(fallbackCertificate);
        setCertificatePhase(fallbackPhase);
        setCurrentCertificate(fallbackCertificate);
        setCurrentCasBalance('0');
        setLastTxHash(latest.transaction?.txHash || '');
      }
    } else {
      setCertificate(null);
      setCertificatePhase(null);
      setCurrentCertificate(null);
      setCurrentCasBalance('0');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [loadedConfig, profileResponse, challengesResponse, requestsResponse] = await Promise.all([
          loadCertificateConfig(session?.jwt),
          getProfile(session?.jwt),
          loadChallenges(session?.jwt),
          listMyIssuanceRequests(session?.jwt),
        ]);
        if (cancelled) return;
        setConfig(loadedConfig);
        if (challengesResponse?.length > 0) {
          setChallenges(challengesResponse);
        }
        if (requestsResponse?.length > 0) {
          setIssuanceRequests(requestsResponse);
        }
        if (loadedConfig.currentPhase?.id) {
          setPhase({
            id: String(loadedConfig.currentPhase.id),
            name: loadedConfig.currentPhase.name || 'Sócio Fundador',
            certificateType: loadedConfig.currentPhase.certificateType || loadedConfig.currentPhase.name || '',
            minCasDeposit: String(
              loadedConfig.currentPhase.casAmount || DEFAULT_PHASE.minCasDeposit
            ),
            active: Boolean(loadedConfig.currentPhase.active),
            minted: String(loadedConfig.currentPhase.minted || '0'),
            skillsDescription: loadedConfig.currentPhase.skillsDescription || '',
            instructions: loadedConfig.currentPhase.instructions || '',
            achievementSummary: loadedConfig.currentPhase.achievementSummary || '',
          });
        }
        if (profileResponse.status < 400) {
          setProfileName(normalizeCertificateName(profileResponse.data?.profile?.name));
        } else {
          setError(profileResponse.data?.error || 'Nao foi possivel carregar o nome do perfil.');
        }
      } catch (loadError) {
        if (!cancelled) setError(walletError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session?.jwt]);

  useEffect(() => {
    if (!ethers.isAddress(config?.certificateAddress || '')) return;
    if (!account || !ethers.isAddress(account)) return;
    let cancelled = false;
    loadCertificates(config, account, session?.jwt).catch((loadError) => {
      if (!cancelled) setError(walletError(loadError));
    });
    return () => { cancelled = true; };
  }, [account, config?.certificateAddress, config?.casTokenAddress, config?.chainId, loadCertificates, session?.jwt]);

  useEffect(() => {
    if (!account || !config?.casTokenAddress || !getProvider()) return;
    let cancelled = false;
    async function readWalletBalance() {
      try {
        const rawProvider = getProvider();
        if (!rawProvider) return;
        const provider = new ethers.BrowserProvider(rawProvider);
        const cas = getCasContract(config.casTokenAddress, provider);
        const [casBal, polBal, gasEst] = await Promise.all([
          cas.balanceOf(account),
          provider.getBalance(account),
          estimateMintGasCost(config, account, provider),
        ]);
        if (!cancelled) {
          setCasBalance(casBal.toString());
          setPolBalance(polBal.toString());
          setGasEstimate(gasEst);
        }
      } catch {
        // Silently ignore — the JsonRpcProvider fallback in loadCertificates already set a value.
      }
    }
    readWalletBalance();
    return () => { cancelled = true; };
  }, [account, config?.casTokenAddress, config?.chainId, config?.diamondAddress, getProvider]);

  useEffect(() => {
    const feeTypeId = phase?.extraFeeTypeId;
    const hasFee = Boolean(feeTypeId && feeTypeId !== '0');
    if (!hasFee || !ethers.isAddress(config?.diamondAddress || '')) {
      setExtraFeeAmount(null);
      return;
    }
    let cancelled = false;
    async function fetchExtraFee() {
      setExtraFeeLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const diamond = new ethers.Contract(config.diamondAddress, DIAMOND_READ_ABI, provider);
        const amount = await diamond.getCustomFee(BigInt(feeTypeId));
        if (!cancelled) setExtraFeeAmount(amount.toString());
      } catch {
        if (!cancelled) setExtraFeeAmount(null);
      } finally {
        if (!cancelled) setExtraFeeLoading(false);
      }
    }
    fetchExtraFee();
    return () => { cancelled = true; };
  }, [config?.diamondAddress, config?.rpcUrl, phase?.extraFeeTypeId]);

  useEffect(() => {
    if (!session?.jwt) return;
    let cancelled = false;
    async function loadLinkedWallet() {
      try {
        const { status, data } = await listLinkedAccounts(session.jwt);
        if (cancelled || status >= 400 || !Array.isArray(data.accounts)) {
          if (!cancelled) setAccountsChecked(true);
          return;
        }
        setLinkedAccountsList(data.accounts);
        const metamask = data.accounts.find((a) => a.provider === 'metamask');
        if (metamask?.providerId) {
          setLinkedWalletAddress(ethers.getAddress(metamask.providerId));
        }
      } catch {
        // Non-critical: linked wallet detection is best-effort.
      } finally {
        if (!cancelled) setAccountsChecked(true);
      }
    }
    loadLinkedWallet();
    return () => { cancelled = true; };
  }, [session?.jwt]);

  const walletMismatch = Boolean(
    account && linkedWalletAddress &&
    account.toLowerCase() !== linkedWalletAddress.toLowerCase()
  );

  const currentProvider = session?.subject?.authenticationMethod || session?.subject?.provider || '';
  const hasGoogleIdentity =
    currentProvider === 'google' || linkedAccountsList.some((a) => a.provider === 'google');
  const hasMetamaskIdentity =
    currentProvider === 'metamask' || linkedAccountsList.some((a) => a.provider === 'metamask');
  const accountsMerged = hasGoogleIdentity && hasMetamaskIdentity;

  const nameMatches = Boolean(
    certificate && profileName && account &&
    hashCertificateName(profileName, account) === certificate.nameHash
  );

  const manifest = useMemo(() => {
    if (!config || !certificate || !profileName || !nameMatches) return null;
    return buildCertificateManifest({
      config,
      phase: certificatePhase || phase,
      certificate,
      recipientName: profileName,
      txHash: lastTxHash,
    });
  }, [certificate, certificatePhase, config, lastTxHash, nameMatches, phase, profileName]);

  // A arte precisa refletir sempre o item selecionado: usa o manifesto emitido
  // apenas quando ele corresponde a fase/desafio escolhido, caso contrario cai
  // para a previa (draft) daquela fase.
  const previewManifest = useMemo(() => {
    const manifestPhaseId = manifest?.certificate?.phaseId;
    const manifestMatchesSelection = !selectedChallengeId
      || String(manifestPhaseId) === String(selectedChallengeId);
    if (manifest && manifestMatchesSelection) return manifest;
    return buildDraftManifest({ config, phase, recipientName: profileName, recipient: account });
  }, [account, config, manifest, phase, profileName, selectedChallengeId]);

  const requiredCas = phase?.minCasDeposit || DEFAULT_PHASE.minCasDeposit;
  const hasExtraFee = Boolean(phase?.extraFeeTypeId && phase.extraFeeTypeId !== '0');
  const totalRequiredCas = BigInt(requiredCas || 0) + BigInt(extraFeeAmount || 0);
  const hasEnoughCas = BigInt(casBalance || 0) >= totalRequiredCas;
  const hasEnoughPol = !gasEstimate || BigInt(polBalance || 0) >= gasEstimate.estimatedCost;

  const selectedChallengeRequest = useMemo(() => {
    if (!selectedChallengeId) return null;
    return issuanceRequests.find(
      (r) => String(r.challengeId) === String(selectedChallengeId),
    ) || null;
  }, [issuanceRequests, selectedChallengeId]);

  const isApproved = selectedChallengeRequest?.status === 'approved';
  const isPending = selectedChallengeRequest?.status === 'pending';
  const isRejected = selectedChallengeRequest?.status === 'rejected';
  const needsApproval = Boolean(selectedChallengeId) && !isApproved;

  const selectedChallenge = useMemo(() => {
    if (!selectedChallengeId) return null;
    return challenges.find(
      (c) => String(c.onchainPhaseId || c.id) === String(selectedChallengeId),
    ) || null;
  }, [challenges, selectedChallengeId]);

  // As habilidades e instrucoes orientam o candidato ate o certificado ser
  // efetivamente emitido on-chain; depois disso o proprio certificado ja e a evidencia.
  const showChallengeBriefing = Boolean(
    selectedChallenge
    && !currentCertificate
    && selectedChallenge.hasCertificate !== true
    && (selectedChallenge.skillsDescription || selectedChallenge.instructions)
  );

  async function handleRequestCertificate() {
    if (!selectedChallengeId || !session?.jwt) return;
    setError('');
    setSuccess('');
    try {
      const res = await requestChallengeCertificate(
        selectedChallengeId,
        { userName: profileName || undefined },
        session.jwt,
      );
      if (res.status >= 400) {
        throw new Error(res.data?.error || res.data?.message || 'Falha ao solicitar certificado.');
      }
      setSuccess('Solicitação enviada. Aguarde a aprovação do administrador.');
      const updated = await listMyIssuanceRequests(session.jwt);
      setIssuanceRequests(updated || []);
    } catch (reqErr) {
      setError(reqErr.message || 'Erro ao solicitar certificado.');
    }
  }

  async function refresh() {
    if (!ethers.isAddress(config?.certificateAddress || '')) return;
    setRefreshing(true);
    setError('');
    try {
      await loadCertificates(config, account, session?.jwt);
    } catch (refreshError) {
      setError(walletError(refreshError));
    } finally {
      setRefreshing(false);
    }
  }

  async function ensureWallet() {
    let recipient = account;
    if (!recipient) {
      const result = await connect();
      recipient = result.accounts?.[0];
    }
    if (!recipient) throw new Error('Conecte uma carteira para continuar.');
    if (Number(chainId) !== Number(config.chainId)) {
      setStep('Trocando para a rede oficial...');
      await switchChain(Number(config.chainId));
    }
    return recipient;
  }

  async function handleMint() {
    setError('');
    setSuccess('');
    if (!config?.enabled) {
      setError('A emissao ainda nao foi ativada: configure e implante o contrato de certificados.');
      return;
    }
    if (!profileName) {
      setError('Cadastre seu nome completo no perfil antes de emitir o certificado.');
      return;
    }
    if (!phase?.active) {
      setError('Nao ha uma fase de certificados ativa neste momento.');
      return;
    }

    setMinting(true);
    try {
      const recipient = await ensureWallet();
      await loadCertificates(config, recipient, session?.jwt);
      const freshContext = await readCertificateContext(config, recipient);
      if (freshContext?.certificate) {
        setSuccess(`Voce ja possui o certificado #${freshContext.certificate.tokenId} nesta fase.`);
        setMinting(false);
        return;
      }
      const nameHash = hashCertificateName(profileName, recipient);

      console.log('[CertificatePageClient.handleMint] start', {
        certificateAddress: config.certificateAddress,
        diamondAddress: config.diamondAddress,
        casTokenAddress: config.casTokenAddress,
        issuerAddress: config.issuerAddress,
        phaseId: phase.id,
        recipient,
      });

      setStep('Confirmando sua elegibilidade como inscrito...');
      const preparedResponse = await prepareCertificateMint({
        recipient,
        recipientName: profileName,
        nameHash,
        phaseId: phase.id,
        certificateAddress: config.certificateAddress,
      }, session.jwt);
      if (preparedResponse.status >= 400) {
        throw new Error(preparedResponse.data?.error || 'O emissor recusou a solicitacao.');
      }
      const prepared = preparedResponse.data?.data || preparedResponse.data;
      const mint = prepared.authorization
        ? prepared
        : prepared.certificate?.mint;
      const authorization = normalizeAuthorization(mint);
      const issuer = mint?.issuer || mint?.issuerAddress || config.issuerAddress;
      const signature = mint?.signature;

      console.log('[CertificatePageClient] prepared mint', {
        status: preparedResponse.status,
        authorization,
        issuer,
        signature,
      });

      if (!ethers.isAddress(issuer) || !ethers.isHexString(signature)) {
        throw new Error('A autorizacao retornada pelo emissor esta incompleta.');
      }
      if (authorization.recipient.toLowerCase() !== recipient.toLowerCase()) {
        throw new Error('A autorizacao foi emitida para outra carteira.');
      }
      if (authorization.nameHash !== nameHash) {
        throw new Error('O nome autorizado nao corresponde ao nome do seu perfil.');
      }
      if (authorization.phaseId !== String(phase.id)) {
        throw new Error('A fase mudou durante a emissao. Atualize a pagina e tente novamente.');
      }
      if (BigInt(authorization.casAmount) !== BigInt(requiredCas)) {
        throw new Error('O valor CAS autorizado difere do aporte minimo publicado para a fase.');
      }
      if (BigInt(authorization.deadline) <= BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error('A autorizacao de emissao expirou. Tente novamente.');
      }

      const rawProvider = getProvider();
      if (!rawProvider) throw new Error('Carteira nao conectada.');
      const provider = new ethers.BrowserProvider(rawProvider);
      const signer = await provider.getSigner();
      const cas = getCasContract(config.casTokenAddress, signer);
      const contract = getCertificateContract(config.certificateAddress, signer);
      const balance = await cas.balanceOf(recipient);
      setCasBalance(balance.toString());

      console.log('[CertificatePageClient] contracts ready', {
        balance: balance.toString(),
        certificateAddress: config.certificateAddress,
        diamondAddress: config.diamondAddress,
        casTokenAddress: config.casTokenAddress,
      });
      let useDiamond = ethers.isAddress(config.diamondAddress);
      if (useDiamond) {
        try {
          const diamond = getDiamondCertificateContract(config.diamondAddress, signer);
          const diamondCert = await diamond.getCertificateContract();
          const trustedRole = await contract.TRUSTED_CALLER_ROLE();
          const isTrusted = await contract.hasRole(trustedRole, config.diamondAddress);
          if (
            diamondCert.toLowerCase() !== config.certificateAddress.toLowerCase() ||
            !isTrusted
          ) {
            useDiamond = false;
            console.warn('[CertificatePageClient] Diamond registry/role mismatch — using direct contract. diamondCert:', diamondCert, 'isTrusted:', isTrusted);
          }
        } catch (guardErr) {
          useDiamond = false;
          console.warn('[CertificatePageClient] Diamond trust check failed — using direct contract.', guardErr);
        }
      }
      console.log('[CertificatePageClient] useDiamond decision', { useDiamond });
      // Quando o fluxo passa pelo Diamond, o CertificateFacet cobra o deposito
      // (casAmount) e, se a fase tiver taxa extra configurada, tambem a taxa
      // (extraFeeAmount) via safeTransferFrom na mesma transacao.
      const totalNeeded = useDiamond
        ? BigInt(authorization.casAmount) + BigInt(extraFeeAmount || 0)
        : BigInt(authorization.casAmount);

      console.log('[CertificatePageClient] totalNeeded', {
        useDiamond,
        totalNeeded: totalNeeded.toString(),
        balance: balance.toString(),
        extraFeeAmount: String(extraFeeAmount || 0),
      });

      if (balance < totalNeeded) {
        setShowSwap(true);
        throw new Error(
          `Saldo CAS insuficiente. Voce precisa de ${formatCasAmount(totalNeeded.toString())} ` +
          `(deposito + taxa de emissao); seu saldo e ${formatCasAmount(balance.toString(), 6)}.`
        );
      }

      let mintTx;
      if (useDiamond) {
        // Fluxo via Diamond Proxy: aprova o Diamond (contrato conhecido/verificado)
        // para gastar o CAS necessario (deposito + taxa extra) e emite em uma unica transacao.
        // O CertificateFacet puxa casAmount para o contrato de certificados e extraFee
        // para o InfrastructureFund, ambos via safeTransferFrom.
        const diamond = getDiamondCertificateContract(config.diamondAddress, signer);
        const currentAllowance = await cas.allowance(recipient, config.diamondAddress);

        console.log('[CertificatePageClient] diamond allowance', {
          currentAllowance: currentAllowance.toString(),
          totalNeeded: totalNeeded.toString(),
          diamondAddress: config.diamondAddress,
        });

        if (currentAllowance < totalNeeded) {
          setStep(`Aprovando ${formatCasAmount(totalNeeded.toString())} CAS (depósito + taxa) para o Diamond...`);
          const approveTx = await cas.approve(config.diamondAddress, totalNeeded);
          await approveTx.wait();
        }

        setStep('Emitindo o NFT e criando a conta ERC-6551 (via Diamond)...');
        console.log('[CertificatePageClient] calling depositAndMintCertificate', { authorization, issuer, signature });
        mintTx = await diamond.depositAndMintCertificate(authorization, issuer, signature);
      } else {
        setStep('Verificando configuração do contrato de certificado...');
        const onChainCasToken = await contract.casToken();
        console.log('[CertificatePageClient] on-chain casToken check', {
          onChainCasToken,
          configCasToken: config.casTokenAddress,
          certificateAddress: config.certificateAddress,
        });
        if (onChainCasToken.toLowerCase() !== (config.casTokenAddress || '').toLowerCase()) {
          throw new Error(`O contrato de certificado espera o token CAS ${onChainCasToken}, mas o frontend esta configurado para ${config.casTokenAddress}.`);
        }

        let needsTransfer = true;
        try {
          console.log('[CertificatePageClient] checking for existing unaccounted deposit', { phaseId: authorization.phaseId });
          await contract.depositCasForMint.staticCall(authorization.phaseId);
          console.log('[CertificatePageClient] existing unaccounted deposit found — skipping CAS transfer');
          needsTransfer = false;
        } catch (checkErr) {
          console.log('[CertificatePageClient] no existing unaccounted deposit — CAS transfer required', { error: checkErr?.message || String(checkErr) });
        }

        if (needsTransfer) {
          setStep(`Transferindo ${formatCasAmount(authorization.casAmount)} CAS para o contrato...`);
          console.log('[CertificatePageClient] calling cas.transfer', {
            certificateAddress: config.certificateAddress,
            casAmount: authorization.casAmount,
          });
          const transferTx = await cas.transfer(config.certificateAddress, authorization.casAmount);
          await transferTx.wait(2);
        }

        setStep('Aguardando o contrato reconhecer o depósito...');
        let depositSimulation = false;
        for (let attempt = 0; attempt < 6; attempt += 1) {
          try {
            console.log('[CertificatePageClient] depositCasForMint simulation attempt', { attempt, phaseId: authorization.phaseId });
            await contract.depositCasForMint.staticCall(authorization.phaseId);
            console.log('[CertificatePageClient] depositCasForMint simulation ok', { attempt });
            depositSimulation = true;
            break;
          } catch (staticErr) {
            console.warn('[CertificatePageClient] depositCasForMint simulation failed', { attempt, error: staticErr?.message || String(staticErr) });
            if (attempt < 5) {
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
        }
        if (!depositSimulation) {
          throw new Error('O depósito de CAS foi enviado, mas o contrato ainda não o reconhece na rede. Aguarde alguns minutos e clique em emitir novamente SEM transferir mais tokens.');
        }

        setStep('Registrando o depósito CAS...');
        console.log('[CertificatePageClient] calling depositCasForMint', { phaseId: authorization.phaseId });
        const depositTx = await contract.depositCasForMint(authorization.phaseId);
        await depositTx.wait(2);

        setStep('Emitindo o NFT e criando a conta ERC-6551...');
        console.log('[CertificatePageClient] calling mintCertificate', { authorization, issuer, signature });
        mintTx = await contract.mintCertificate(authorization, issuer, signature);
      }

      console.log('[CertificatePageClient] mint tx sent', { hash: mintTx.hash });
      setLastTxHash(mintTx.hash);
      setStep('Aguardando a confirmacao na Polygon...');
      const receipt = await mintTx.wait();
      console.log('[CertificatePageClient] receipt', {
        status: receipt.status,
        logsCount: receipt.logs?.length,
        gasUsed: receipt.gasUsed?.toString?.(),
      });
      if (receipt.status !== 1) throw new Error('A transacao nao foi confirmada pela rede.');
      const minted = parseCertificateMinted(receipt, contract.interface);

      setStep('Registrando o recibo no site...');
      const confirmation = await confirmCertificateMint({
        txHash: mintTx.hash,
        tokenId: minted.tokenId,
        issuanceId: minted.issuanceId,
      }, session.jwt);
      const confirmationWarning = confirmation.status >= 400
        ? ' O NFT foi emitido, mas o recibo ainda precisa ser sincronizado com o site.'
        : '';

      const mintedCertificate = {
        tokenId: minted.tokenId,
        phaseId: minted.phaseId,
        recipient: minted.recipient,
        tokenBoundAccount: minted.tokenBoundAccount,
        issuanceId: minted.issuanceId,
        nameHash: minted.nameHash,
        metadataHash: minted.metadataHash,
        casDeposited: minted.casAmount,
        issuedAt: String(Math.floor(Date.now() / 1000)),
        revoked: false,
        revocationReasonHash: ethers.ZeroHash,
        revokedAt: '0',
        documentHash: ethers.ZeroHash,
      };
      setCertificate(mintedCertificate);
      setCurrentCertificate(mintedCertificate);
      setCertificatePhase(phase);
      setCurrentPhaseCasBalance(minted.casAmount);
      setCurrentCasBalance(minted.casAmount);
      setLastTxHash(mintTx.hash);

      await loadCertificates(config, recipient, session?.jwt);
      setSuccess(`Certificado #${minted.tokenId} emitido com sucesso.${confirmationWarning}`);
    } catch (mintError) {
      console.error('[CertificatePageClient] mint error:', mintError);
      const parsed = parseWalletError(mintError, { account, config });
      console.error('[CertificatePageClient] parsed wallet error:', parsed);
      setWalletErrorObj(parsed);
    } finally {
      setStep('');
      setMinting(false);
    }
  }

  async function selectCertificate(issuance) {
    if (!config || !issuance?.token?.tokenId) return;
    setRefreshing(true);
    setError('');
    try {
      const selected = await readCertificateByToken(config, issuance.token.tokenId);
      setCertificate(selected.certificate);
      setCertificatePhase(selected.phase);
      setCurrentCasBalance(selected.currentCasBalance);
      setLastTxHash(issuance.transaction?.txHash || '');
      // Mantem a fase corrente e o desafio selecionado alinhados com a arte.
      if (selected.phase?.id) {
        setSelectedChallengeId(String(selected.phase.id));
        setPhase(selected.phase);
      }
    } catch (selectionError) {
      const fallbackCertificate = {
        tokenId: String(issuance.token.tokenId),
        phaseId: issuance.phase?.id || '0',
        recipient: issuance.holder?.wallet || '',
        tokenBoundAccount: issuance.token?.tokenBoundAccount || '',
        issuanceId: issuance.issuanceId,
        nameHash: issuance.holder?.nameHash || ethers.ZeroHash,
        metadataHash: issuance.metadataHash || ethers.ZeroHash,
        casDeposited: String(issuance.reserve?.amount || '0'),
        issuedAt: issuance.issuedAt ? String(Math.floor(new Date(issuance.issuedAt).getTime() / 1000)) : String(Math.floor(Date.now() / 1000)),
        revoked: false,
        revocationReasonHash: ethers.ZeroHash,
        revokedAt: '0',
        documentHash: ethers.ZeroHash,
      };
      const fallbackPhase = {
        ...phase,
        id: issuance.phase?.id || phase.id,
        name: issuance.phase?.name || phase.name,
        certificateType: issuance.phase?.certificateType || issuance.phase?.name || phase.certificateType,
        achievementSummary: issuance.phase?.achievementSummary || phase.achievementSummary,
      };
      setCertificate(fallbackCertificate);
      setCurrentCertificate(fallbackCertificate);
      setCertificatePhase(fallbackPhase);
      setCurrentCasBalance('0');
      setLastTxHash(issuance.transaction?.txHash || '');
      if (fallbackPhase.id) {
        setSelectedChallengeId(String(fallbackPhase.id));
        setPhase(fallbackPhase);
      }
      console.warn('[CertificatePageClient] selectCertificate on-chain failed — using API data', { tokenId: issuance.token.tokenId, error: selectionError?.message || String(selectionError) });
    } finally {
      setRefreshing(false);
    }
  }

  function getArtwork() {
    const svg = artworkRef.current?.querySelector('svg');
    if (!svg) throw new Error('A arte do certificado ainda nao foi carregada.');
    return svg;
  }

  async function handlePdf() {
    if (!manifest) return;
    setExporting('pdf');
    setError('');
    try {
      await downloadCertificatePdf(getArtwork(), manifest);
    } catch (exportError) {
      setError(walletError(exportError));
    } finally {
      setExporting('');
    }
  }

  async function handleSvg() {
    if (!manifest) return;
    setExporting('svg');
    setError('');
    try {
      await downloadCertificateSvg(getArtwork(), manifest);
    } catch (exportError) {
      setError(walletError(exportError));
    } finally {
      setExporting('');
    }
  }

  async function handleInstructionsPdf() {
    if (!selectedChallenge) return;
    setExporting('instructions');
    setError('');
    try {
      await downloadChallengeInstructionsPdf(selectedChallenge);
    } catch (exportError) {
      setError(walletError(exportError));
    } finally {
      setExporting('');
    }
  }

  async function copyLinkedInData() {
    if (!manifest) return;
    const lines = [
      `Credencial: Certificado de ${manifest.certificate.phaseTitle} — Agentic Space`,
      `Organizacao emissora: ${manifest.issuer.legalName}`,
      `ID da credencial: AS-${manifest.blockchain.chainId}-${manifest.certificate.tokenId}`,
      `URL da credencial: ${manifest.verificationUrl}`,
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setSuccess('Dados da credencial copiados para incluir no LinkedIn.');
  }

  function shareLinkedIn() {
    if (!manifest) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(manifest.verificationUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  if (loading || !accountsChecked) {
    return <div className="flex justify-center py-24"><Spinner size={28} /></div>;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 p-6 shadow-2xl sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-300">
              <Award size={16} /> Certificado verificável de Sócio Fundador
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Seu apoio se torna uma credencial on-chain
            </h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              A emissão requer <strong className="text-white">{formatCasAmount(requiredCas)}</strong>{' '}
              e o gas da rede. Os CAS vão para a conta ERC-6551 do próprio diploma e permanecem sob
              seu controle. Depois, o administrador pode conceder uma única vez o mesmo valor em CAS
              como bônus diretamente à sua carteira.
            </p>
          </div>
          <Link href="/certificado/verificar" className="btn-secondary whitespace-nowrap">
            <BadgeCheck size={18} /> Verificar um certificado
          </Link>
        </div>
      </section>

      {accountsChecked && !accountsMerged && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Contas não mescladas</p>
            <p className="mt-1 text-sm text-amber-100/80">
              Para visualizar e validar seu certificado, é necessário ter uma conta blockchain
              mesclada com uma conta Google. Acesse seu{' '}
              <Link href="/profile" className="text-brand-400 hover:text-brand-300">perfil</Link>{' '}
              para conectar e mesclar as contas.
            </p>
          </div>
        </div>
      )}

      {accountsMerged && (
        <>

      {!config?.enabled && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Previa disponivel; emissao indisponivel neste momento</p>
            <p className="mt-1 text-sm text-amber-100/80">
              O contrato, o emissor ou uma fase ativa ainda precisam ser configurados. Certificados ja emitidos continuam consultaveis.
            </p>
            {config?.unavailableReasons?.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Motivos da indisponibilidade:</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
                  {config.unavailableReasons.map((reason) => (
                    <li key={reason} className="font-mono">{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {config?.onchain?.available === false && config?.onchain?.reason && (
              <p className="mt-2 text-sm text-amber-100/80">
                <span className="font-semibold">Motivo on-chain:</span> <span className="font-mono">{config.onchain.reason}</span>
              </p>
            )}
            {config?.onchain?.available === true && !config?.onchain?.issuerAuthorized && (
              <p className="mt-2 text-sm text-amber-100/80">
                <span className="font-semibold">Atencao:</span> O emissor ({config?.issuerAddress || 'N/A'}) nao possui ISSUER_ROLE no contrato ({config?.certificateAddress || 'N/A'}).
              </p>
            )}
            <div className="mt-3 text-xs text-amber-100/50">
              <p>Contrato: {config?.certificateAddress || 'N/A'}</p>
              <p>Emissor: {config?.issuerAddress || 'N/A'}</p>
              <p>Diamond: {config?.diamondAddress || 'N/A'}</p>
              <p>Fase atual: {config?.currentPhase ? `ID ${config.currentPhase.id}, ativa=${config.currentPhase.active}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {walletMismatch && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Carteira conectada difere da carteira vinculada ao perfil</p>
            <p className="mt-1 text-sm text-amber-100/80">
              A conta conectada (<a href={`${config?.explorerUrl || 'https://polygonscan.com'}/address/${account}`} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">{compactHash(account)}</a>) não corresponde à carteira MetaMask
              vinculada ao seu perfil (<a href={`${config?.explorerUrl || 'https://polygonscan.com'}/address/${linkedWalletAddress}`} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">{compactHash(linkedWalletAddress)}</a>). O NFT será registrado
              na conta conectada. Para emitir na conta correta, desconecte esta e conecte a
              carteira vinculada, ou vincule a conta atual no seu{' '}
              <Link href="/profile" className="text-brand-400 hover:text-brand-300">perfil</Link>.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Fase vigente</p>
                <h2 className="mt-1 text-xl font-bold text-white">{phase?.name || 'Sócio Fundador'}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                phase?.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {phase?.active ? 'Ativa' : 'Encerrada'}
              </span>
            </div>

            {challenges.length > 0 && (
              <div>
                <label className="label">Desafios disponíveis</label>
                <select
                  value={selectedChallengeId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedChallengeId(id || null);
                    const ch = challenges.find((c) => String(c.id) === id || String(c.onchainPhaseId) === id);
                    if (ch) {
                      setPhase({
                        id: String(ch.onchainPhaseId || ch.id),
                        name: ch.name || 'Desafio',
                        certificateType: ch.name || 'Desafio',
                        minCasDeposit: String(ch.minCasDeposit || DEFAULT_PHASE.minCasDeposit),
                        active: ch.status === 'active' || ch.active === true,
                        minted: String(ch.minted || '0'),
                        skillsDescription: ch.skillsDescription || '',
                        instructions: ch.instructions || '',
                        achievementSummary: ch.achievementSummary || '',
                        extraFeeTypeId: String(ch.extraFeeTypeId || '0'),
                        tbaRebateBps: Number(ch.tbaRebateBps || 0),
                      });
                    }
                  }}
                  className="input"
                >
                  <option value="">Selecione um desafio...</option>
                  {challenges.map((ch) => {
                    const id = String(ch.onchainPhaseId || ch.id);
                    const unlocked = ch.unlocked !== false;
                    const hasCert = ch.hasCertificate === true;
                    return (
                      <option key={id} value={id} disabled={!unlocked}>
                        {ch.name}{!unlocked ? ' (bloqueado)' : hasCert ? ' (concluído)' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedChallenge?.prerequisitePhaseIds?.length > 0 && (
                  <p className="mt-2 text-xs text-amber-300">
                    Requer: {selectedChallenge.prerequisitePhaseIds.map((id) => {
                      const prereq = challenges.find((c) => Number(c.onchainPhaseId) === id);
                      return prereq?.name || `#${id}`;
                    }).join(', ')}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  As habilidades e instruções do desafio aparecem abaixo da prévia do certificado.
                </p>
              </div>
            )}

            {issuanceRequests.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">Minhas solicitações</p>
                {issuanceRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300">Desafio #{req.challengeId}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' :
                      req.status === 'rejected' ? 'bg-red-500/15 text-red-300' :
                      'bg-amber-500/15 text-amber-300'
                    }`}>
                      {req.status === 'approved' ? 'Aprovado' :
                       req.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="label">Nome no certificado</label>
              <input className="input" value={profileName} readOnly placeholder="Cadastre seu nome no perfil" />
              <p className="mt-2 text-xs text-slate-500">
                O contrato grava somente o hash do nome. Para alterar, use seu{' '}
                <Link href="/profile" className="text-brand-400 hover:text-brand-300">perfil</Link>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Aporte minimo</p>
                <p className="mt-1 font-semibold text-white">{formatCasAmount(requiredCas)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Emitidos na fase</p>
                <p className="mt-1 font-semibold text-white">{phase?.minted || '0'}</p>
              </div>
            </div>

            {!account ? (
              <button onClick={() => connect().catch((connectError) => setWalletErrorObj(parseWalletError(connectError, { account, config })))} disabled={isConnecting} className="btn-secondary w-full">
                {isConnecting ? <Spinner size={16} /> : <Wallet size={17} />}
                {isConnecting ? 'Conectando...' : 'Conectar carteira'}
              </button>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Carteira</span>
                  <a href={`${config?.explorerUrl || 'https://polygonscan.com'}/address/${account}`} target="_blank" rel="noopener noreferrer" className="font-mono text-slate-200 hover:text-brand-300">{compactHash(account)}</a>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Coins size={14} /> Saldo CAS
                  </span>
                  <span className={hasEnoughCas ? 'text-emerald-300' : 'text-amber-300'}>
                    {formatCasAmount(casBalance, 6)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Fuel size={14} /> Saldo POL
                  </span>
                  <span className={hasEnoughPol ? 'text-emerald-300' : 'text-amber-300'}>
                    {formatPolAmount(polBalance)}
                  </span>
                </div>
                {gasEstimate && !currentCertificate && (
                  <div className="mt-2 border-t border-slate-800 pt-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500">Gas estimado p/ emissão</span>
                      <span className="text-slate-400">{formatPolCost(gasEstimate.estimatedCost)}</span>
                    </div>
                    <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                      hasEnoughPol ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {hasEnoughPol ? (
                        <><CheckCircle2 size={12} /> POL suficiente para o gas</>
                      ) : (
                        <><AlertCircle size={12} /> POL insuficiente para o gas</>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!currentCertificate && !hasEnoughCas && account && (
              <button onClick={() => setShowSwap(true)} className="btn-secondary w-full">
                <Coins size={17} /> Comprar CAS
              </button>
            )}

            {!currentCertificate ? (
              <>
                {gasEstimate && !hasEnoughPol && account && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <Fuel className="mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="font-semibold">POL insuficiente para o gas</p>
                      <p className="mt-1 text-amber-100/80">
                        Seu saldo de POL ({formatPolAmount(polBalance)}) é inferior ao estimado
                        para o gas da emissão ({formatPolCost(gasEstimate.estimatedCost)}).
                        Adicione POL na sua carteira na rede Polygon para continuar.
                      </p>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200/90">
                  <p className="font-semibold">ℹ️ Fluxo de emissão em 3 passos</p>
                  <p className="mt-1 text-blue-100/70">
                    A emissão envolve três transações: (1) transferência de CAS para o contrato,
                    (2) registro do depósito e (3) mint do NFT. O contrato é verificado no{' '}
                    <a
                      href="https://polygonscan.com/address/0xAaFc452FA2b0F224588c7Eb893ad5cAa098037A1#code"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-100"
                    >Polygonscan</a>.
                  </p>
                </div>
                {needsApproval && selectedChallengeId && (
                  <div className="space-y-3">
                    {isPending && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>Sua solicitação está em análise. Aguarde a aprovação do administrador para depositar CAS e finalizar a emissão.</p>
                      </div>
                    )}
                    {isRejected && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>Sua solicitação foi rejeitada. Revise as instruções do desafio e solicite novamente.</p>
                      </div>
                    )}
                    {!selectedChallengeRequest && (
                      <div className="flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>Para emitir o certificado, primeiro solicite a aprovação do administrador. Após a aprovação, você poderá depositar CAS e finalizar a emissão.</p>
                      </div>
                    )}
                    {!selectedChallengeRequest && (
                      <button
                        onClick={handleRequestCertificate}
                        disabled={!profileName || minting}
                        className="btn-secondary w-full"
                      >
                        <FileCheck2 size={17} /> Solicitar Certificado
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowMintModal(true)}
                  disabled={minting || !profileName || !phase?.active || !config?.enabled || (gasEstimate && !hasEnoughPol) || needsApproval || extraFeeLoading}
                  className="btn-primary w-full"
                >
                  {minting ? <Spinner size={17} /> : <Award size={17} />}
                  {minting
                    ? (step || 'Processando...')
                    : needsApproval
                      ? 'Aguardando aprovação'
                      : extraFeeLoading
                        ? 'Carregando custos...'
                        : 'Emitir certificado'}
                </button>
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Aporte (reserva TBA)</span>
                    <span className="text-slate-200">{formatCasAmount(requiredCas)}</span>
                  </div>
                  {hasExtraFee && (
                    <div className="mt-1 flex items-center justify-between">
                      <span>Taxa de emissão</span>
                      <span className="text-slate-200">
                        {extraFeeLoading ? '...' : extraFeeAmount != null ? formatCasAmount(extraFeeAmount) : '—'}
                      </span>
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1.5 font-semibold">
                    <span className="text-slate-300">Custo total</span>
                    <span className="text-white">{formatCasAmount(totalRequiredCas.toString())}</span>
                  </div>
                  {hasExtraFee && Number(phase.tbaRebateBps) > 0 && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {Number(phase.tbaRebateBps) / 100}% da taxa retorna para a TBA do seu Sócio Fundador; o restante vai para o Fundo de Infraestrutura.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className={`rounded-xl border p-4 ${
                currentCertificate.revoked
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-emerald-500/30 bg-emerald-500/10'
              }`}>
                <div className={`flex items-center gap-2 font-semibold ${
                  currentCertificate.revoked ? 'text-red-300' : 'text-emerald-300'
                }`}>
                  {currentCertificate.revoked
                    ? <AlertCircle size={19} />
                    : <CheckCircle2 size={19} />}
                  Certificado #{currentCertificate.tokenId}{' '}
                  {currentCertificate.revoked ? 'revogado' : 'emitido'}
                </div>
                <p className={`mt-2 text-xs ${
                  currentCertificate.revoked ? 'text-red-100/70' : 'text-emerald-100/70'
                }`}>
                  Saldo atual na conta ERC-6551: {formatCasAmount(currentPhaseCasBalance, 6)}
                </p>
              </div>
            )}

            <button
              onClick={refresh}
              disabled={refreshing || !ethers.isAddress(config?.certificateAddress || '')}
              className="btn-secondary w-full"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Atualizar dados
            </button>
          </div>

          {certificateHistory.length > 0 && (
            <div className="card space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                  Meus certificados
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  As credenciais de fases anteriores continuam disponiveis.
                </p>
              </div>
              <div className="space-y-2">
                {certificateHistory.map((issuance) => {
                  const selected = certificate?.tokenId === String(issuance.token.tokenId);
                  return (
                    <button
                      key={issuance.issuanceId}
                      type="button"
                      onClick={() => selectCertificate(issuance)}
                      disabled={refreshing}
                      aria-pressed={selected}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                        selected
                          ? 'border-brand-400/50 bg-brand-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{issuance.phase.name}</span>
                        <span className="text-xs text-slate-500">Token #{issuance.token.tokenId}</span>
                      </span>
                      <Award size={17} className="shrink-0 text-brand-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card space-y-3 text-sm text-slate-300">
            <div className="flex gap-3"><Fuel className="mt-0.5 shrink-0 text-brand-400" size={18} /><p>A emissão requer o aporte CAS da fase e o gas da Polygon; o bônus de devolução depende da aprovação administrativa.</p></div>
            <div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-cyan-400" size={18} /><p>O certificado e intransferivel; a conta vinculada e controlada pelo titular.</p></div>
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-violet-400" size={18} /><p>Na blockchain fica apenas o hash; seu nome aparece no diploma e nos metadados publicos da credencial.</p></div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div id="certificate-print-target" ref={artworkRef} className="certificate-preview-shell">
            <CertificateSvg manifest={previewManifest} draft={!manifest} page={certificatePage} />
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <button
              type="button"
              onClick={() => setCertificatePage('front')}
              aria-label="Frente do certificado"
              aria-pressed={certificatePage === 'front'}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                certificatePage === 'front'
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-600 bg-transparent hover:border-slate-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setCertificatePage('back')}
              aria-label="Verso do certificado"
              aria-pressed={certificatePage === 'back'}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                certificatePage === 'back'
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-600 bg-transparent hover:border-slate-400'
              }`}
            />
          </div>

          {showChallengeBriefing && (
            <div className="rounded-2xl border border-brand-500/20 bg-slate-950/60 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                    Desafio selecionado
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">{selectedChallenge.name}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  isApproved
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}>
                  {isApproved
                    ? 'Aprovado — pronto para emitir'
                    : isPending
                      ? 'Em análise'
                      : isRejected
                        ? 'Rejeitado'
                        : 'Aguardando solicitação'}
                </span>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                {selectedChallenge.skillsDescription && (
                  <section>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Award size={16} className="text-brand-400" /> Habilidades adquiridas
                    </h4>
                    <MarkdownContent className="mt-3">
                      {selectedChallenge.skillsDescription}
                    </MarkdownContent>
                  </section>
                )}

                {selectedChallenge.instructions && (
                  <section>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <FileCheck2 size={16} className="text-blue-400" /> Instruções
                    </h4>
                    <MarkdownContent className="mt-3">
                      {selectedChallenge.instructions}
                    </MarkdownContent>
                  </section>
                )}
              </div>

              <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
                Estas orientações deixam de ser exibidas assim que o certificado for emitido
                on-chain.
              </p>

              <button
                onClick={handleInstructionsPdf}
                disabled={Boolean(exporting)}
                className="btn-secondary mt-4"
              >
                {exporting === 'instructions' ? <Spinner size={16} /> : <Download size={17} />}
                {exporting === 'instructions' ? 'Gerando PDF...' : 'Baixar instruções em PDF'}
              </button>
            </div>
          )}

          {certificate && !nameMatches && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              O nome atual do perfil nao corresponde ao hash gravado na emissao. Restaure o nome original para gerar um PDF verificavel.
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 shrink-0" size={18} /> {error}
            </div>
          )}
          {success && (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {success}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={handlePdf} disabled={!manifest || Boolean(exporting)} className="btn-primary">
              {exporting === 'pdf' ? <Spinner size={16} /> : <Download size={17} />} Baixar PDF
            </button>
            <button onClick={() => window.print()} disabled={!manifest} className="btn-secondary">
              <Printer size={17} /> Imprimir
            </button>
            <button onClick={handleSvg} disabled={!manifest || Boolean(exporting)} className="btn-secondary">
              {exporting === 'svg' ? <Spinner size={16} /> : <FileCheck2 size={17} />} Baixar SVG
            </button>
            <button onClick={copyLinkedInData} disabled={!manifest || certificate?.revoked} className="btn-secondary">
              <Linkedin size={17} /> Copiar dados para LinkedIn
            </button>
            <button onClick={shareLinkedIn} disabled={!manifest || certificate?.revoked} className="btn-secondary">
              <ExternalLink size={17} /> Compartilhar
            </button>
            {certificate?.tokenBoundAccount && config?.explorerUrl && (
              <a
                href={`${config.explorerUrl}/address/${certificate.tokenBoundAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Wallet size={17} /> Ver reserva ERC-6551
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm text-slate-300">
            <h3 className="flex items-center gap-2 font-semibold text-white"><FileCheck2 size={18} className="text-blue-400" /> Assinatura gov.br</h3>
            <p className="mt-2">
              O diploma reserva o campo visual para assinatura. Baixe o PDF, e o envie para o número (85) 985205490 ou e-mail agenticspace@rapport.tec.br, com o assunto: Favor Assinar,  assim que for assinado digitalmente será retornado e o reembolso será realizado conforme a fase que o certificado pertencer. Preserve o arquivo digital original. Não use “imprimir como PDF” depois de assinar, pois isso remove a assinatura eletrônica.
            </p>
            <p className="mt-2">
              A assinatura PAdES precisa continuar sendo validada no VALIDAR do ITI. Esta aplicação comprova separadamente o vínculo do certificado e o hash do documento registrado on-chain; essa conferência não substitui a validação criptográfica da assinatura gov.br/ICP-Brasil.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <a href="https://assinador.iti.br/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">Assinar no gov.br ↗</a>
              <a href="https://validar.iti.gov.br/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">Abrir VALIDAR do ITI ↗</a>
              <a href="https://www.gov.br/governodigital/pt-br/identidade/assinatura-eletronica" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">Instruções oficiais de assinatura ↗</a>
              <a href="https://www.gov.br/pt-br/servicos/validar-servico-de-validacao-de-assinaturas-eletronicas" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">Informações oficiais do VALIDAR ↗</a>
            </div>
          </div>
        </div>
      </section>

      {showSwap && config && (
        <CASSwapModal
          open={showSwap}
          onClose={() => { setShowSwap(false); refresh(); }}
          casSwapAddress={config.casSwapAddress}
          casTokenAddress={config.casTokenAddress}
          explorerUrl={config.explorerUrl}
          chainId={config.chainId}
        />
      )}

      {walletErrorObj && (
        <WalletErrorModal
          error={walletErrorObj}
          onClose={() => setWalletErrorObj(null)}
        />
      )}

      {showMintModal && (
        <MintConfirmationModal
          phase={phase}
          requiredCas={requiredCas}
          hasExtraFee={hasExtraFee}
          extraFeeAmount={extraFeeAmount}
          extraFeeLoading={extraFeeLoading}
          totalRequiredCas={totalRequiredCas}
          gasEstimate={gasEstimate}
          useDiamond={ethers.isAddress(config?.diamondAddress || '')}
          onCancel={() => setShowMintModal(false)}
          onConfirm={() => {
            setShowMintModal(false);
            handleMint();
          }}
        />
      )}

        </>
      )}

    </div>
  );
}

/**
 * Modal de confirmacao exibido antes de emitir o certificado. Detalha de
 * forma transparente todos os valores cobrados (aporte CAS + taxa extra),
 * o destino de cada valor, o custo de gas estimado e os passos on-chain que
 * serao executados, para que o usuario nunca seja surpreendido por uma
 * cobranca nao explicada.
 */
function MintConfirmationModal({
  phase,
  requiredCas,
  hasExtraFee,
  extraFeeAmount,
  extraFeeLoading,
  totalRequiredCas,
  gasEstimate,
  useDiamond,
  onCancel,
  onConfirm,
}) {
  const rebateBps = Number(phase?.tbaRebateBps || 0);
  const hasRebate = hasExtraFee && rebateBps > 0;
  const feeValue = extraFeeAmount != null ? BigInt(extraFeeAmount) : 0n;
  const tbaShare = hasRebate ? (feeValue * BigInt(rebateBps)) / 10000n : 0n;
  const infraShare = hasExtraFee ? feeValue - tbaShare : 0n;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="card my-8 w-full max-w-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Award size={20} className="text-brand-400" />
            Confirmar emissão do certificado
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Breakdown de custos */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            O que você vai pagar
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Landmark size={15} className="text-cyan-400" /> Aporte CAS (reserva TBA)
              </span>
              <span className="font-semibold text-white">{formatCasAmount(requiredCas)}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Este valor fica reservado na conta token-bound (TBA) do seu certificado NFT.
              Permanece sob seu controle e é devolvido se o certificado for revogado.
            </p>
          </div>

          {hasExtraFee && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <Coins size={15} className="text-amber-400" /> Taxa de emissão
                </span>
                <span className="font-semibold text-white">
                  {extraFeeLoading ? <Spinner size={14} /> : formatCasAmount(extraFeeAmount || '0')}
                </span>
              </div>
              {hasRebate ? (
                <p className="mt-1.5 text-xs text-slate-400">
                  {rebateBps / 100}% ({formatCasAmount(tbaShare.toString())}) retorna para a TBA do
                  seu certificado Sócio Fundador; o restante ({formatCasAmount(infraShare.toString())})
                  vai para o Fundo de Infraestrutura da comunidade.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  Este valor vai integralmente para o Fundo de Infraestrutura, que mantém os
                  serviços e a operação da comunidade Agentic Space.
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-200">Custo total em CAS</span>
              <span className="text-lg font-bold text-white">
                {formatCasAmount(totalRequiredCas.toString())}
              </span>
            </div>
          </div>

          {gasEstimate && (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Fuel size={15} className="text-orange-400" /> Gas estimado (Polygon)
              </span>
              <span className="font-semibold text-white">{formatPolCost(gasEstimate.estimatedCost)}</span>
            </div>
          )}
        </div>

        {/* Passos do fluxo */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            O que vai acontecer
          </p>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
              {useDiamond ? (
                <span>Aprovar o contrato Diamond para gastar {formatCasAmount(totalRequiredCas.toString())} do seu saldo CAS.</span>
              ) : (
                <span>Transferir {formatCasAmount(requiredCas)} CAS para o contrato de certificados.</span>
              )}
            </li>
            {useDiamond ? (
              <>
                <li className="flex items-start gap-2">
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
                  <span>Depositar {formatCasAmount(requiredCas)} CAS na conta ERC-6551 do certificado.</span>
                </li>
                {hasExtraFee && (
                  <li className="flex items-start gap-2">
                    <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
                    <span>Pagar {formatCasAmount(extraFeeAmount || '0')} de taxa de emissão (dividida entre TBA e Fundo de Infraestrutura).</span>
                  </li>
                )}
              </>
            ) : (
              <li className="flex items-start gap-2">
                <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
                <span>Registrar o depósito CAS no contrato de certificados.</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
              <span>Emitir o NFT do certificado e criar a conta ERC-6551 vinculada a ele.</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-400" />
              <span>Aguardar a confirmação da transação na rede Polygon.</span>
            </li>
          </ol>
        </div>

        {/* Avisos */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <span>
            O certificado é intransferível (SBT). O contrato grava apenas o hash do seu nome —
            a operação é registrada permanentemente na blockchain e não pode ser desfeita.
          </span>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
          <span>
            Você precisará confirmar cada transação na sua carteira (MetaMask). Mantenha a página
            aberta até o processo terminar.
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={extraFeeLoading} className="btn-primary">
            <Award size={16} />
            Entendi, emitir certificado
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CertificatePageClient() {
  return <RequireAuth><CertificateContent /></RequireAuth>;
}
