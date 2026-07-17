'use client';

import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Hash,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { apiRequest } from '@/lib/api';
import {
  compactHash,
  formatCasAmount,
  loadCertificateConfig,
  verifyCertificateManifest,
  verifyCertificateReference,
} from '@/lib/certificates';
import { extractCertificateManifest } from '@/lib/certificate-pdf';

const CHECK_LABELS = {
  schema: 'Formato oficial do manifesto',
  issuer: 'Emissor e CNPJ correspondem',
  issuance: 'Identificador de emissao corresponde',
  recipientName: 'Nome corresponde ao hash on-chain',
  recipient: 'Carteira titular corresponde',
  phase: 'Fase e tipo do diploma correspondem',
  metadata: 'Metadados correspondem ao registro',
  account: 'Conta ERC-6551 corresponde',
  deposit: 'Aporte inicial CAS corresponde',
  issuedAt: 'Data de emissao corresponde',
  notRevoked: 'Certificado nao foi revogado',
  onchain: 'Registro ativo no contrato oficial',
};

function parseReference(value, config) {
  const text = String(value || '').trim();
  if (!text) throw new Error('Informe um Token ID, codigo ou URL de verificacao.');
  try {
    const url = new URL(text);
    const chainId = url.searchParams.get('chain');
    const contractAddress = url.searchParams.get('contract');
    const tokenId = url.searchParams.get('token');
    if (chainId && contractAddress && tokenId) return { chainId, contractAddress, tokenId };
  } catch {
    // Continua para os formatos curtos.
  }
  const triplet = text.match(/^(\d+)[:/]((?:0x)?[0-9a-fA-F]{40})[:/](\d+)$/);
  if (triplet) return { chainId: triplet[1], contractAddress: triplet[2], tokenId: triplet[3] };
  const code = text.match(/^AS-(\d+)-(\d+)$/i);
  if (code) return { chainId: code[1], contractAddress: config.certificateAddress, tokenId: code[2] };
  if (/^\d+$/.test(text)) {
    return { chainId: config.chainId, contractAddress: config.certificateAddress, tokenId: text };
  }
  throw new Error('Referencia invalida. Use o Token ID, AS-rede-token ou a URL completa.');
}

async function sha256File(file) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return ethers.hexlify(new Uint8Array(digest));
}

function ResultBanner({ valid, title, children }) {
  return (
    <div className={`rounded-2xl border p-5 ${
      valid
        ? 'border-emerald-500/35 bg-emerald-500/10'
        : 'border-red-500/35 bg-red-500/10'
    }`}>
      <div className="flex items-start gap-3">
        {valid
          ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={28} />
          : <XCircle className="mt-0.5 shrink-0 text-red-400" size={28} />}
        <div>
          <h2 className={`text-xl font-bold ${valid ? 'text-emerald-200' : 'text-red-200'}`}>{title}</h2>
          <div className={`mt-1 text-sm ${valid ? 'text-emerald-100/75' : 'text-red-100/75'}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function VerificationDetails({ result, manifest, exactHash }) {
  const record = result.record;
  const explorer = result.config.explorerUrl;
  const checks = result.checks || {};
  const documentAttested = record.documentHash && record.documentHash !== ethers.ZeroHash;
  const exactAttested = Boolean(documentAttested && exactHash?.applicable);
  return (
    <div className="space-y-5">
      <ResultBanner
        valid={result.valid && (!exactAttested || exactHash?.matches)}
        title={result.valid && (!exactAttested || exactHash?.matches)
          ? 'Registro e manifesto autenticos'
          : 'A verificacao encontrou divergencias'}
      >
        {result.valid
          ? 'Os dados recuperados do arquivo correspondem ao NFT emitido pelo contrato oficial.'
          : 'Nao use este documento como comprovante antes de revisar os itens abaixo.'}
      </ResultBanner>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-white"><BadgeCheck size={18} className="text-brand-400" /> Dados oficiais</h3>
          {manifest?.certificate?.recipientName && (
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Titular</p><p className="text-lg font-semibold text-white">{manifest.certificate.recipientName}</p></div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500">Fase</p><p className="text-slate-200">{result.phase.name}</p></div>
            <div><p className="text-slate-500">Token ID</p><p className="font-mono text-slate-200">#{record.tokenId}</p></div>
            <div><p className="text-slate-500">Emissao</p><p className="text-slate-200">{new Date(Number(record.issuedAt) * 1000).toLocaleDateString('pt-BR')}</p></div>
            <div><p className="text-slate-500">Aporte inicial</p><p className="text-slate-200">{formatCasAmount(record.casDeposited)}</p></div>
          </div>
          <div className="text-sm">
            <p className="text-slate-500">Carteira titular</p>
            <a href={`${explorer}/address/${record.recipient}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand-400 hover:text-brand-300">
              {compactHash(record.recipient, 12, 10)} <ExternalLink size={13} />
            </a>
          </div>
          <div className="text-sm">
            <p className="text-slate-500">Conta vinculada ERC-6551</p>
            <a href={`${explorer}/address/${record.tokenBoundAccount}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand-400 hover:text-brand-300">
              {compactHash(record.tokenBoundAccount, 12, 10)} <ExternalLink size={13} />
            </a>
            <p className="mt-1 text-slate-400">Saldo atual: {result.currentCasBalanceFormatted}</p>
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-white"><ShieldCheck size={18} className="text-cyan-400" /> Conferencias</h3>
          {Object.entries(checks).map(([key, passed]) => (
            <div key={key} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 text-sm last:border-0">
              <span className="text-slate-300">{CHECK_LABELS[key] || key}</span>
              {passed ? <Check size={17} className="shrink-0 text-emerald-400" /> : <X size={17} className="shrink-0 text-red-400" />}
            </div>
          ))}
          {exactAttested && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3 text-sm">
              <span className="text-slate-300">Hash exato do arquivo atestado</span>
              {exactHash?.matches ? <Check size={17} className="text-emerald-400" /> : <X size={17} className="text-red-400" />}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 text-sm text-slate-300">
        <h3 className="flex items-center gap-2 font-semibold text-white"><ShieldAlert size={18} className="text-blue-400" /> Assinatura gov.br e integridade do PDF</h3>
        <p className="mt-2">
          Esta pagina valida o manifesto e o registro blockchain. A assinatura PAdES/gov.br e uma verificacao criptografica separada e deve ser conferida no servico oficial do ITI.
        </p>
        {!documentAttested && (
          <p className="mt-2 text-amber-300">
            O manifesto e o NFT correspondem, mas este arquivo ainda nao possui um hash exato atestado on-chain. Alteracoes puramente visuais so ficam cobertas depois da assinatura e da atestacao administrativa do PDF final.
          </p>
        )}
        {documentAttested && !exactHash?.applicable && (
          <p className="mt-2 text-slate-400">
            O hash atestado pertence ao PDF final. Este SVG e conferido pelo manifesto e pelo NFT, mas nao pelo hash documental do PDF.
          </p>
        )}
        {exactAttested && !exactHash?.matches && (
          <p className="mt-2 text-amber-300">
            O arquivo difere da versao cujo hash foi atestado on-chain. Isso tambem ocorre depois de uma assinatura PAdES legitima; nesse caso, confirme a integridade no VALIDAR.
          </p>
        )}
        <a href="https://validar.iti.gov.br/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-brand-400 hover:text-brand-300">
          Abrir VALIDAR do ITI <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function ReferenceDetails({ result }) {
  return (
    <div className="space-y-5">
      <ResultBanner valid={result.valid} title={result.valid ? 'Certificado on-chain valido' : 'Certificado revogado ou invalido'}>
        A consulta por Token ID confirma o registro publico. Para conferir o nome do titular, envie o PDF ou SVG original.
      </ResultBanner>
      <div className="card grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-slate-500">Fase</p><p className="mt-1 text-white">{result.phase.name}</p></div>
        <div><p className="text-slate-500">Token ID</p><p className="mt-1 font-mono text-white">#{result.record.tokenId}</p></div>
        <div><p className="text-slate-500">Aporte inicial</p><p className="mt-1 text-white">{formatCasAmount(result.record.casDeposited)}</p></div>
        <div><p className="text-slate-500">Saldo CAS atual</p><p className="mt-1 text-white">{result.currentCasBalanceFormatted}</p></div>
        <div className="sm:col-span-2"><p className="text-slate-500">Titular</p><p className="mt-1 break-all font-mono text-white">{result.record.recipient}</p></div>
        <div className="sm:col-span-2"><p className="text-slate-500">Conta ERC-6551</p><p className="mt-1 break-all font-mono text-white">{result.record.tokenBoundAccount}</p></div>
      </div>
    </div>
  );
}

export default function VerifyCertificateClient() {
  const fileInputRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [reference, setReference] = useState('');
  const [manifest, setManifest] = useState(null);
  const [result, setResult] = useState(null);
  const [referenceResult, setReferenceResult] = useState(null);
  const [exactHash, setExactHash] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadCertificateConfig().then((loaded) => {
      if (cancelled) return;
      setConfig(loaded);
      setConfigLoading(false);
      const params = new URLSearchParams(window.location.search);
      const chainId = params.get('chain');
      const contractAddress = params.get('contract');
      const tokenId = params.get('token');
      const issuanceId = params.get('id');
      if (chainId && contractAddress && tokenId) {
        const urlReference = `${chainId}:${contractAddress}:${tokenId}`;
        setReference(urlReference);
        runReference(urlReference, loaded);
      } else if (issuanceId) {
        runIssuanceReference(issuanceId, loaded);
      }
    }).catch((loadError) => {
      if (!cancelled) {
        setConfigLoading(false);
        setError(loadError.message || 'Falha ao carregar o verificador.');
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    setReferenceResult(null);
    setManifest(null);
    setFileName(file.name);
    try {
      const extracted = await extractCertificateManifest(file);
      const verification = await verifyCertificateManifest(extracted, config);
      const documentHash = await sha256File(file);
      const attested = verification.record.documentHash !== ethers.ZeroHash;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const fileHashCheck = {
        hash: documentHash,
        attested,
        applicable: attested && isPdf,
        matches: !attested || !isPdf || documentHash === verification.record.documentHash,
      };
      setManifest(extracted);
      setExactHash(fileHashCheck);
      setResult({
        ...verification,
        valid: verification.valid && fileHashCheck.matches,
      });
    } catch (fileError) {
      setError(fileError.message || 'Nao foi possivel verificar o arquivo.');
    } finally {
      setBusy(false);
    }
  }

  async function runReference(value = reference, activeConfig = config) {
    if (!activeConfig) return;
    setBusy(true);
    setError('');
    setResult(null);
    setReferenceResult(null);
    try {
      const parsed = parseReference(value, activeConfig);
      const verification = await verifyCertificateReference(parsed, activeConfig);
      setReferenceResult(verification);
    } catch (referenceError) {
      setError(referenceError.message || 'Nao foi possivel consultar esta referencia.');
    } finally {
      setBusy(false);
    }
  }

  async function runIssuanceReference(issuanceId, activeConfig) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(String(issuanceId || ''))) {
      setError('O identificador publico do certificado e invalido.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await apiRequest(`/certificates/${encodeURIComponent(issuanceId)}`);
      if (response.status >= 400) {
        throw new Error(response.data?.error || 'Certificado confirmado nao encontrado.');
      }
      const publicCertificate = response.data?.certificate;
      if (!publicCertificate?.token?.tokenId) {
        throw new Error('O registro publico ainda nao possui Token ID confirmado.');
      }
      const urlReference = [
        publicCertificate.network?.chainId,
        publicCertificate.network?.contractAddress,
        publicCertificate.token.tokenId,
      ].join(':');
      setReference(urlReference);
      const parsed = parseReference(urlReference, activeConfig);
      const verification = await verifyCertificateReference(parsed, activeConfig);
      setReferenceResult(verification);
    } catch (referenceError) {
      setError(referenceError.message || 'Nao foi possivel consultar esta referencia.');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
          <BadgeCheck size={34} />
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Verificar certificado</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Carregue o PDF ou SVG para comparar o manifesto com o NFT, a fase, a revogacao e a conta ERC-6551 na blockchain.
        </p>
      </section>

      {configLoading ? (
        <div className="flex justify-center py-14"><Spinner size={26} /></div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><UploadCloud className="text-brand-400" size={21} /> Enviar certificado</h2>
            <p className="mt-1 text-sm text-slate-500">O arquivo e processado localmente no navegador. Limite: 15 MB.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`mt-5 flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                dragging ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'
              }`}
            >
              {busy ? <Spinner size={30} /> : <FileSearch size={34} className="text-slate-400" />}
              <span className="mt-3 font-medium text-slate-200">{fileName || 'Solte o PDF aqui ou clique para selecionar'}</span>
              <span className="mt-1 text-xs text-slate-500">PDF gerado pelo site ou SVG original</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/svg+xml,.pdf,.svg"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>

          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Hash className="text-cyan-400" size={21} /> Consultar por ID</h2>
            <p className="mt-1 text-sm text-slate-500">Use o Token ID, codigo AS-rede-token ou a URL impressa no diploma.</p>
            <div className="mt-5">
              <label className="label">Token, codigo ou URL</label>
              <textarea
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                rows={5}
                className="input resize-none font-mono"
                placeholder="Ex.: 42 ou AS-137-42"
              />
            </div>
            <button onClick={() => runReference()} disabled={busy || !reference || !ethers.isAddress(config?.certificateAddress || '')} className="btn-primary mt-4 w-full">
              {busy ? <Spinner size={16} /> : <Search size={17} />} Consultar blockchain
            </button>
            {!ethers.isAddress(config?.certificateAddress || '') && (
              <p className="mt-3 flex items-start gap-2 text-xs text-amber-300"><AlertCircle size={14} className="mt-0.5 shrink-0" /> Contrato oficial ainda nao configurado neste ambiente.</p>
            )}
          </div>
        </section>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={21} />
          <div><p className="font-semibold">Nao foi possivel validar</p><p className="mt-1 text-sm text-red-100/75">{error}</p></div>
        </div>
      )}

      {result && <VerificationDetails result={result} manifest={manifest} exactHash={exactHash} />}
      {referenceResult && <ReferenceDetails result={referenceResult} />}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center"><ShieldCheck className="mx-auto text-emerald-400" size={24} /><h3 className="mt-3 font-semibold text-white">Contrato oficial</h3><p className="mt-1 text-sm text-slate-500">Apenas o endereco confiavel configurado pelo emissor e consultado.</p></div>
        <div className="card text-center"><WalletCards className="mx-auto text-cyan-400" size={24} /><h3 className="mt-3 font-semibold text-white">Conta ERC-6551</h3><p className="mt-1 text-sm text-slate-500">A conta vinculada e o saldo CAS atual sao conferidos na rede.</p></div>
        <div className="card text-center"><ShieldAlert className="mx-auto text-violet-400" size={24} /><h3 className="mt-3 font-semibold text-white">gov.br separado</h3><p className="mt-1 text-sm text-slate-500">A assinatura PAdES deve ser validada pelo ITI, sem alegacoes automaticas.</p></div>
      </section>
    </div>
  );
}
