'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  CheckCircle2,
  Coins,
  Download,
  ExternalLink,
  FileCheck2,
  Fuel,
  Linkedin,
  LockKeyhole,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import Spinner from '@/components/Spinner';
import CASSwapModal from '@/components/CASSwapModal';
import CertificateSvg from '@/components/certificates/CertificateSvg';
import { useAuth } from '@/lib/auth-context';
import { getProfile, listLinkedAccounts } from '@/lib/api';
import { useWallet } from '@/lib/wallet/useWallet';
import {
  buildCertificateManifest,
  buildDraftManifest,
  compactHash,
  confirmCertificateMint,
  formatCasAmount,
  getCasContract,
  getCertificateContract,
  hashCertificateName,
  listMyCertificateIssuances,
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
} from '@/lib/certificate-pdf';

const DEFAULT_PHASE = {
  id: '1',
  name: 'Sócio Fundador',
  minCasDeposit: ethers.parseEther('50').toString(),
  active: true,
  minted: '0',
};

function walletError(error) {
  const message = error?.shortMessage || error?.reason || error?.message || 'Falha na operacao.';
  if (error?.code === 4001 || /user rejected|user denied/i.test(message)) {
    return 'A solicitacao foi cancelada na carteira.';
  }
  if (/insufficient funds/i.test(message)) {
    return 'Saldo de POL insuficiente para pagar o gas da transacao.';
  }
  return message;
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
  const [linkedWalletAddress, setLinkedWalletAddress] = useState(null);

  const loadCertificates = useCallback(async (activeConfig, recipient, jwt) => {
    if (!ethers.isAddress(activeConfig?.certificateAddress || '')) return;
    const [context, issuances] = await Promise.all([
      readCertificateContext(activeConfig, recipient),
      listMyCertificateIssuances(jwt),
    ]);
    if (context.phase) {
      setPhase(context.phase);
    } else {
      setPhase((previous) => ({ ...previous, id: '0', active: false, minted: '0' }));
    }
    setCurrentCertificate(context.certificate);
    setCurrentPhaseCasBalance(context.currentCasBalance);
    setCasBalance(context.casBalance);
    const confirmed = issuances.filter(
      (issuance) => issuance.status === 'confirmed' && issuance.token?.tokenId
    );
    setCertificateHistory(confirmed);

    if (context.certificate) {
      setCertificate(context.certificate);
      setCertificatePhase(context.phase);
      setCurrentCasBalance(context.currentCasBalance);
      return;
    }

    const latest = confirmed[0];
    if (latest?.token?.tokenId) {
      const historical = await readCertificateByToken(activeConfig, latest.token.tokenId);
      setCertificate(historical.certificate);
      setCertificatePhase(historical.phase);
      setCurrentCasBalance(historical.currentCasBalance);
      setLastTxHash(latest.transaction?.txHash || '');
    } else {
      setCertificate(null);
      setCertificatePhase(null);
      setCurrentCasBalance('0');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [loadedConfig, profileResponse] = await Promise.all([
          loadCertificateConfig(session?.jwt),
          getProfile(session?.jwt),
        ]);
        if (cancelled) return;
        setConfig(loadedConfig);
        if (loadedConfig.currentPhase?.id) {
          setPhase({
            id: String(loadedConfig.currentPhase.id),
            name: loadedConfig.currentPhase.name || 'Sócio Fundador',
            minCasDeposit: String(
              loadedConfig.currentPhase.casAmount || DEFAULT_PHASE.minCasDeposit
            ),
            active: Boolean(loadedConfig.currentPhase.active),
            minted: String(loadedConfig.currentPhase.minted || '0'),
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
    loadCertificates(config, account, session?.jwt).catch((loadError) => setError(walletError(loadError)));
  }, [account, config, loadCertificates, session?.jwt]);

  useEffect(() => {
    if (!account || !config?.casTokenAddress || !getProvider()) return;
    let cancelled = false;
    async function readWalletBalance() {
      try {
        const rawProvider = getProvider();
        if (!rawProvider) return;
        const provider = new ethers.BrowserProvider(rawProvider);
        const cas = getCasContract(config.casTokenAddress, provider);
        const balance = await cas.balanceOf(account);
        if (!cancelled) setCasBalance(balance.toString());
      } catch {
        // Silently ignore — the JsonRpcProvider fallback in loadCertificates already set a value.
      }
    }
    readWalletBalance();
    return () => { cancelled = true; };
  }, [account, config?.casTokenAddress, config?.chainId, getProvider]);

  useEffect(() => {
    if (!session?.jwt) return;
    let cancelled = false;
    async function loadLinkedWallet() {
      try {
        const { status, data } = await listLinkedAccounts(session.jwt);
        if (cancelled || status >= 400 || !Array.isArray(data.accounts)) return;
        const metamask = data.accounts.find((a) => a.provider === 'metamask');
        if (metamask?.providerId) {
          setLinkedWalletAddress(ethers.getAddress(metamask.providerId));
        }
      } catch {
        // Non-critical: linked wallet detection is best-effort.
      }
    }
    loadLinkedWallet();
    return () => { cancelled = true; };
  }, [session?.jwt]);

  const walletMismatch = Boolean(
    account && linkedWalletAddress &&
    account.toLowerCase() !== linkedWalletAddress.toLowerCase()
  );

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

  const previewManifest = useMemo(
    () => manifest || buildDraftManifest({ config, phase, recipientName: profileName, recipient: account }),
    [account, config, manifest, phase, profileName]
  );

  const requiredCas = phase?.minCasDeposit || DEFAULT_PHASE.minCasDeposit;
  const hasEnoughCas = BigInt(casBalance || 0) >= BigInt(requiredCas || 0);

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
      const nameHash = hashCertificateName(profileName, recipient);

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
      if (balance < BigInt(authorization.casAmount)) {
        setShowSwap(true);
        throw new Error(
          `Saldo CAS insuficiente. Voce precisa de ${formatCasAmount(authorization.casAmount)}; ` +
          `seu saldo e ${formatCasAmount(balance.toString(), 6)}.`
        );
      }

      const allowance = await cas.allowance(recipient, config.certificateAddress);
      if (allowance < BigInt(authorization.casAmount)) {
        setStep(`Aprovando ${formatCasAmount(authorization.casAmount)} para o certificado...`);
        const approveTx = await cas.approve(config.certificateAddress, authorization.casAmount);
        await approveTx.wait();
      }

      setStep('Emitindo o NFT e criando a conta ERC-6551...');
      const mintTx = await contract.mintCertificate(authorization, issuer, signature);
      setLastTxHash(mintTx.hash);
      setStep('Aguardando a confirmacao na Polygon...');
      const receipt = await mintTx.wait();
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

      await loadCertificates(config, recipient, session?.jwt);
      setSuccess(`Certificado #${minted.tokenId} emitido com sucesso.${confirmationWarning}`);
    } catch (mintError) {
      setError(walletError(mintError));
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
    } catch (selectionError) {
      setError(walletError(selectionError));
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

  if (loading) {
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

      {!config?.enabled && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Previa disponivel; emissao indisponivel neste momento</p>
            <p className="mt-1 text-sm text-amber-100/80">
              O contrato, o emissor ou uma fase ativa ainda precisam ser configurados. Certificados ja emitidos continuam consultaveis.
            </p>
          </div>
        </div>
      )}

      {walletMismatch && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Carteira conectada difere da carteira vinculada ao perfil</p>
            <p className="mt-1 text-sm text-amber-100/80">
              A conta conectada ({compactHash(account)}) não corresponde à carteira MetaMask
              vinculada ao seu perfil ({compactHash(linkedWalletAddress)}). O NFT será registrado
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
              <button onClick={() => connect().catch((connectError) => setError(walletError(connectError)))} disabled={isConnecting} className="btn-secondary w-full">
                {isConnecting ? <Spinner size={16} /> : <Wallet size={17} />}
                {isConnecting ? 'Conectando...' : 'Conectar carteira'}
              </button>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Carteira</span>
                  <span className="font-mono text-slate-200">{compactHash(account)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-slate-400">Saldo</span>
                  <span className={hasEnoughCas ? 'text-emerald-300' : 'text-amber-300'}>
                    {formatCasAmount(casBalance, 6)}
                  </span>
                </div>
              </div>
            )}

            {!currentCertificate && !hasEnoughCas && account && (
              <button onClick={() => setShowSwap(true)} className="btn-secondary w-full">
                <Coins size={17} /> Comprar CAS
              </button>
            )}

            {!currentCertificate ? (
              <button
                onClick={handleMint}
                disabled={minting || !profileName || !phase?.active || !config?.enabled}
                className="btn-primary w-full"
              >
                {minting ? <Spinner size={17} /> : <Award size={17} />}
                {minting ? (step || 'Processando...') : 'Emitir certificado'}
              </button>
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
            <CertificateSvg manifest={previewManifest} draft={!manifest} />
          </div>

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
    </div>
  );
}

export default function CertificatePageClient() {
  return <RequireAuth><CertificateContent /></RequireAuth>;
}
