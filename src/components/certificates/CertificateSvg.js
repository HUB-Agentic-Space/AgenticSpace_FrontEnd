'use client';

import {
  CERTIFICATE_PDF_MARKER,
  CERTIFICATE_SVG_METADATA_ID,
  encodeCertificateManifest,
} from '@/lib/certificate-pdf';
import { markdownToSvgElements } from '../../lib/markdown-utils';
import { generateQrDataUrl } from '../../lib/qr-utils';
import { useEffect, useState } from 'react';

const RAPPORT_LOGO = '/images/logo-rapport-2026.png';
const AGENTIC_SPACE_LOGO = '/images/logo 2025 - whatsapp.svg';

function compactAddress(value, left = 8, right = 6) {
  if (!value || value === '—') return '—';
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function formatDate(timestamp) {
  const numeric = Number(timestamp || 0);
  if (!numeric) return 'A emitir';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(numeric * 1000));
}

function fitName(name) {
  const length = Array.from(name || '').length;
  if (length <= 30) return 72;
  if (length <= 42) return 60;
  if (length <= 56) return 50;
  return 42;
}

// Margem interna util do certificado: as bordas decorativas ficam em x=69 e
// x=1531, portanto o texto precisa caber dentro dessa faixa.
const TITLE_MAX_WIDTH = 1340;
const TITLE_MAX_BLOCK_HEIGHT = 122;
const TITLE_BASE_FONT_SIZE = 58;
const TITLE_MIN_FONT_SIZE = 26;
const BODY_MAX_WIDTH = 1240;
const BODY_FONT_SIZE = 24;
const BODY_LINE_HEIGHT = 34;

/**
 * Aproxima a largura renderizada de um texto. O SVG e montado sem acesso as
 * metricas reais da fonte, entao usamos o fator medio de largura do glifo.
 */
function measureText(text, fontSize, { widthFactor = 0.58, letterSpacing = 0 } = {}) {
  const chars = Array.from(String(text ?? ''));
  return chars.length * (fontSize * widthFactor + letterSpacing);
}

function wrapText(text, { maxWidth, fontSize, widthFactor, letterSpacing = 0 }) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureText(candidate, fontSize, { widthFactor, letterSpacing }) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines.length > 0 ? lines : [''];
}

/**
 * Quebra o titulo em linhas e reduz proporcionalmente a fonte ate o bloco
 * caber na area interna reservada entre o subtitulo e o "Certificamos que".
 */
function fitTitle(text) {
  for (let fontSize = TITLE_BASE_FONT_SIZE; fontSize >= TITLE_MIN_FONT_SIZE; fontSize -= 2) {
    const lines = wrapText(text, {
      maxWidth: TITLE_MAX_WIDTH,
      fontSize,
      widthFactor: 0.64,
      letterSpacing: 2,
    });
    const lineHeight = Math.round(fontSize * 1.12);
    if (lines.length * lineHeight <= TITLE_MAX_BLOCK_HEIGHT) {
      return { lines, fontSize, lineHeight };
    }
  }

  const fontSize = TITLE_MIN_FONT_SIZE;
  return {
    lines: wrapText(text, {
      maxWidth: TITLE_MAX_WIDTH,
      fontSize,
      widthFactor: 0.64,
      letterSpacing: 2,
    }),
    fontSize,
    lineHeight: Math.round(fontSize * 1.12),
  };
}

function useQrCode(text, opts = {}) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!text) {
      setDataUrl(null);
      return;
    }
    generateQrDataUrl(text, opts)
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => { if (!cancelled) setDataUrl(null); });
    return () => { cancelled = true; };
  }, [text, opts.width, opts.margin, opts.color, opts.background]);

  return dataUrl;
}

function SharedDefs() {
  return (
    <defs>
      <linearGradient id="certificate-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fffdf8" />
        <stop offset="0.5" stopColor="#f8f1df" />
        <stop offset="1" stopColor="#eef3ff" />
      </linearGradient>
      <linearGradient id="certificate-gold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#b86f06" />
        <stop offset="0.5" stopColor="#f6b632" />
        <stop offset="1" stopColor="#c77d09" />
      </linearGradient>
      <linearGradient id="certificate-space" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#50b7f1" />
        <stop offset="1" stopColor="#9763f6" />
      </linearGradient>
      <pattern id="certificate-grid" width="34" height="34" patternUnits="userSpaceOnUse">
        <path d="M34 0H0V34" fill="none" stroke="#172554" strokeOpacity="0.045" strokeWidth="1" />
      </pattern>
      <filter id="certificate-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#00011e" floodOpacity="0.17" />
      </filter>
    </defs>
  );
}

function PageFrame() {
  return (
    <>
      <rect width="1600" height="1131" fill="url(#certificate-bg)" />
      <rect width="1600" height="1131" fill="url(#certificate-grid)" />
      <path d="M0 0H515L0 355Z" fill="#00011e" opacity="0.97" />
      <path d="M1600 1131H1100L1600 795Z" fill="#00011e" opacity="0.97" />
      <path d="M0 0H475L0 315Z" fill="url(#certificate-space)" opacity="0.17" />
      <path d="M1600 1131H1140L1600 835Z" fill="url(#certificate-gold)" opacity="0.26" />
      <rect x="34" y="34" width="1532" height="1063" rx="6" fill="none" stroke="url(#certificate-gold)" strokeWidth="9" />
      <rect x="54" y="54" width="1492" height="1023" rx="4" fill="none" stroke="#00011e" strokeWidth="2" />
      <rect x="69" y="69" width="1462" height="993" rx="3" fill="none" stroke="#d89a23" strokeWidth="1.5" strokeDasharray="7 8" />
    </>
  );
}

function HeaderLogos() {
  return (
    <>
      <g filter="url(#certificate-shadow)">
        <rect x="96" y="82" width="420" height="145" rx="12" fill="#fff" fillOpacity="0.98" />
        <image href={RAPPORT_LOGO} x="111" y="101" width="390" height="108" preserveAspectRatio="xMidYMid meet" />
      </g>
      <g filter="url(#certificate-shadow)">
        <circle cx="1430" cy="153" r="91" fill="#fff" stroke="#d89a23" strokeWidth="5" />
        <clipPath id="agentic-logo-clip"><circle cx="1430" cy="153" r="82" /></clipPath>
        <image
          href={AGENTIC_SPACE_LOGO}
          x="1348"
          y="71"
          width="164"
          height="164"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#agentic-logo-clip)"
        />
      </g>
      <text x="800" y="176" textAnchor="middle" fill="#00011e" fontFamily="Georgia, 'Times New Roman', serif" fontSize="30" letterSpacing="8">
        AGENTIC SPACE
      </text>
      <line x1="585" y1="203" x2="1015" y2="203" stroke="url(#certificate-gold)" strokeWidth="3" />
    </>
  );
}

function FooterBar() {
  return (
    <>
      <text x="105" y="1068" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="700">
        https://rapport.tec.br
      </text>
      <text x="800" y="1068" textAnchor="middle" fill="#475569" fontFamily="Arial, Helvetica, sans-serif" fontSize="17">
        Valide em https://agenticspace.rapport.tec.br/certificado/verificar
      </text>
      <text x="1495" y="1068" textAnchor="end" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="700">
        agenticspace.rapport.tec.br
      </text>
    </>
  );
}

function CertificateFrontPage({ manifest, draft }) {
  const certificate = manifest?.certificate || {};
  const blockchain = manifest?.blockchain || {};
  const phaseTitle = certificate.phaseTitle || 'Sócio Fundador';
  const recipientName = certificate.recipientName || 'Nome do Sócio Fundador';
  const tokenId = certificate.tokenId && certificate.tokenId !== '0' ? certificate.tokenId : '—';
  const verificationCode = tokenId === '—'
    ? 'AGUARDANDO EMISSÃO ON-CHAIN'
    : `AS-${blockchain.chainId || 137}-${tokenId}`;
  const metadataPayload = manifest
    ? `${CERTIFICATE_PDF_MARKER}${encodeCertificateManifest(manifest)}`
    : '';

  const title = fitTitle(`CERTIFICADO DE ${phaseTitle.toLocaleUpperCase('pt-BR')}`);
  const titleStartY = 383 - ((title.lines.length - 1) * title.lineHeight) / 2;

  const bodyText = (() => {
    const summary = certificate.achievementSummary || '';
    const certType = certificate.certificateType || '';
    const isChallenge = Boolean(certificate.phaseId && certType && certType !== 'Sócio Fundador');

    if (summary) {
      return isChallenge
        ? `concluiu o desafio ${phaseTitle}, ${summary}`
        : `integra a fase ${phaseTitle} e ${summary}`;
    }

    return isChallenge
      ? `concluiu o desafio ${phaseTitle}, demonstrando habilidades técnicas com dedicação autodidata, `
        + 'buscando de forma proativa conhecimento e de forma autônoma a solução do desafio para esta certificação.'
      : `integra a fase ${phaseTitle} e demonstrou espírito empreendedor e dedicação ao voluntariado, `
        + 'colaborando ativamente, com sua participação, para o crescimento do ecossistema Agentic Space.';
  })();

  const bodyLines = wrapText(
    bodyText,
    { maxWidth: BODY_MAX_WIDTH, fontSize: BODY_FONT_SIZE, widthFactor: 0.5 }
  );
  const bodyStartY = 654 - ((bodyLines.length - 1) * BODY_LINE_HEIGHT) / 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 1600 1131"
      role="img"
      aria-labelledby="certificate-title certificate-description"
      data-certificate-artwork="rapport-v1"
      data-certificate-page="front"
    >
      <title id="certificate-title">Certificado {phaseTitle} de {recipientName}</title>
      <desc id="certificate-description">
        Certificado emitido pela Raport Tecnologia Inova Simples para o ecossistema Agentic Space.
      </desc>
      <metadata id={CERTIFICATE_SVG_METADATA_ID}>{metadataPayload}</metadata>

      <SharedDefs />
      <PageFrame />
      <HeaderLogos />

      <text x="800" y="305" textAnchor="middle" fill="#b87408" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="24" letterSpacing="7">
        RECONHECIMENTO DIGITAL • ERC-721 + ERC-6551
      </text>
      {title.lines.map((line, index) => (
        <text
          key={`title-${index}`}
          x="800"
          y={titleStartY + (index * title.lineHeight)}
          textAnchor="middle"
          fill="#00011e"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize={title.fontSize}
          letterSpacing="2"
        >
          {line}
        </text>
      ))}

      <text x="800" y="454" textAnchor="middle" fill="#475569" fontFamily="Arial, Helvetica, sans-serif" fontSize="23">
        Certificamos que
      </text>
      <text
        x="800"
        y="545"
        textAnchor="middle"
        fill="#00011e"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize={fitName(recipientName)}
      >
        {recipientName}
      </text>
      <path d="M315 576H1285" stroke="url(#certificate-gold)" strokeWidth="3" />
      <circle cx="315" cy="576" r="5" fill="#d89a23" />
      <circle cx="1285" cy="576" r="5" fill="#d89a23" />

      {bodyLines.map((line, index) => (
        <text
          key={`body-${index}`}
          x="800"
          y={bodyStartY + (index * BODY_LINE_HEIGHT)}
          textAnchor="middle"
          fill="#334155"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize={BODY_FONT_SIZE}
        >
          {line}
        </text>
      ))}
      <text x="800" y="726" textAnchor="middle" fill="#00011e" fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="700">
        Raport Tecnologia Inova Simples • CNPJ: 67.904.299/0001-80
      </text>

      <g transform="translate(115 776)">
        <rect width="640" height="142" rx="18" fill="#00011e" />
        <circle cx="65" cy="71" r="42" fill="none" stroke="url(#certificate-space)" strokeWidth="7" />
        <path d="M45 72L61 88L88 52" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="126" y="49" fill="#93c5fd" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" letterSpacing="2">CONTA VINCULADA AO NFT</text>
        <text x="126" y="83" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="25" fontWeight="700">ERC-6551 • CAS sob controle do titular</text>
        <text x="126" y="115" fill="#cbd5e1" fontFamily="Arial, Helvetica, sans-serif" fontSize="19">
          Aporte inicial: {certificate.initialCasDepositFormatted || '50 CAS'}
        </text>
      </g>

      <g transform="translate(845 776)">
        <text x="315" y="18" textAnchor="middle" fill="#475569" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" letterSpacing="2">
          ESPAÇO PARA ASSINATURA ELETRÔNICA
        </text>
        <path d="M35 91C145 67 218 111 315 78C405 47 482 95 595 69" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />
        <line x1="25" y1="108" x2="605" y2="108" stroke="#00011e" strokeWidth="2" />
        <text x="315" y="137" textAnchor="middle" fill="#00011e" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="19">
          Assinatura digital via gov.br
        </text>
      </g>

      <g transform="translate(115 953)">
        <rect width="1370" height="74" rx="12" fill="#fff" fillOpacity="0.93" stroke="#cbd5e1" />
        <text x="24" y="28" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="15">EMISSÃO</text>
        <text x="24" y="55" fill="#0f172a" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">{formatDate(certificate.issuedAt)}</text>
        <text x="285" y="28" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="15">TOKEN ID</text>
        <text x="285" y="55" fill="#0f172a" fontFamily="monospace" fontSize="18" fontWeight="700">#{tokenId}</text>
        <text x="450" y="28" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="15">TITULAR</text>
        <text x="450" y="55" fill="#0f172a" fontFamily="monospace" fontSize="17">{compactAddress(certificate.recipient)}</text>
        <text x="765" y="28" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="15">CONTA ERC-6551</text>
        <text x="765" y="55" fill="#0f172a" fontFamily="monospace" fontSize="17">{compactAddress(certificate.tokenBoundAccount)}</text>
        <text x="1100" y="28" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="15">CÓDIGO DE VALIDAÇÃO</text>
        <text x="1100" y="55" fill="#b87408" fontFamily="monospace" fontSize="17" fontWeight="700">{verificationCode}</text>
      </g>

      <FooterBar />

      {draft && (
        <g transform="rotate(-18 800 565)" opacity="0.12">
          <rect x="320" y="470" width="960" height="155" rx="18" fill="#b91c1c" />
          <text x="800" y="572" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="70" letterSpacing="7">
            PRÉVIA • NÃO EMITIDO
          </text>
        </g>
      )}
      {certificate.revoked && (
        <g transform="rotate(-18 800 565)" opacity="0.72">
          <rect x="365" y="480" width="870" height="145" rx="18" fill="#991b1b" />
          <text x="800" y="576" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="72" letterSpacing="10">
            CERTIFICADO REVOGADO
          </text>
        </g>
      )}
    </svg>
  );
}

function CertificateBackPage({ manifest }) {
  const certificate = manifest?.certificate || {};
  const blockchain = manifest?.blockchain || {};
  const phaseTitle = certificate.phaseTitle || 'Sócio Fundador';
  const recipientName = certificate.recipientName || 'Nome do Sócio Fundador';
  const tokenId = certificate.tokenId && certificate.tokenId !== '0' ? certificate.tokenId : '—';

  const verificationUrl = manifest?.verificationUrl || '';
  const explorerUrl = blockchain.explorerUrl || 'https://polygonscan.com';
  const nftUrl = blockchain.contractAddress && tokenId !== '—'
    ? `${explorerUrl}/token/${blockchain.contractAddress}?a=${tokenId}`
    : '';

  const qrVerification = useQrCode(verificationUrl, { width: 240, margin: 1 });
  const qrNft = useQrCode(nftUrl, { width: 240, margin: 1 });

  const skillsElements = certificate.skillsDescription
    ? markdownToSvgElements(certificate.skillsDescription, {
        startX: 120,
        startY: 340,
        lineHeight: 22,
        fontSize: 15,
        maxWidth: 1000,
      })
    : [];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 1600 1131"
      role="img"
      aria-labelledby="back-title back-description"
      data-certificate-artwork="rapport-v1"
      data-certificate-page="back"
    >
      <title id="back-title">Verso do Certificado — {phaseTitle}</title>
      <desc id="back-description">
        Habilidades adquiridas, instruções e QR Codes de validação do certificado e do NFT on-chain.
      </desc>

      <SharedDefs />
      <PageFrame />
      <HeaderLogos />

      <text x="800" y="305" textAnchor="middle" fill="#b87408" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="24" letterSpacing="7">
        HABILIDADES E VALIDAÇÃO
      </text>

      {certificate.skillsDescription && (
        <g>
          <text x="120" y="280" fill="#00011e" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="700">
            Habilidades adquiridas
          </text>
          <line x1="120" y1="295" x2="780" y2="295" stroke="url(#certificate-gold)" strokeWidth="2" />
          {skillsElements.map((el, idx) => (
            <text
              key={`skill-${idx}`}
              x={el.x}
              y={el.y}
              fill="#334155"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize={el.fontSize}
              fontWeight={el.fontWeight}
            >
              {el.text}
            </text>
          ))}
        </g>
      )}

      <g transform="translate(1100 280)">
        <text x="200" y="0" textAnchor="middle" fill="#00011e" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">
          Validação do certificado
        </text>
        {qrVerification ? (
          <image href={qrVerification} x="80" y="20" width="240" height="240" />
        ) : (
          <rect x="80" y="20" width="240" height="240" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        )}
        <text x="200" y="285" textAnchor="middle" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="13">
          {verificationUrl ? 'Escaneie para validar' : 'Disponível após emissão'}
        </text>
      </g>

      <g transform="translate(1100 580)">
        <text x="200" y="0" textAnchor="middle" fill="#00011e" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">
          NFT on-chain
        </text>
        {qrNft ? (
          <image href={qrNft} x="80" y="20" width="240" height="240" />
        ) : (
          <rect x="80" y="20" width="240" height="240" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        )}
        <text x="200" y="285" textAnchor="middle" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="13">
          {nftUrl ? 'Escaneie para ver on-chain' : 'Disponível após emissão'}
        </text>
      </g>

      <g transform="translate(115 700)">
        <rect width="930" height="60" rx="8" fill="#fff" fillOpacity="0.9" stroke="#cbd5e1" />
        <text x="20" y="25" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="14">TITULAR</text>
        <text x="20" y="48" fill="#0f172a" fontFamily="monospace" fontSize="16" fontWeight="700">{recipientName}</text>
        <text x="350" y="25" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="14">TOKEN ID</text>
        <text x="350" y="48" fill="#0f172a" fontFamily="monospace" fontSize="16" fontWeight="700">#{tokenId}</text>
        <text x="600" y="25" fill="#64748b" fontFamily="Arial, Helvetica, sans-serif" fontSize="14">FASE</text>
        <text x="600" y="48" fill="#0f172a" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700">{phaseTitle}</text>
      </g>

      <g transform="translate(115 790)">
        <rect width="1370" height="120" rx="12" fill="#00011e" />
        <text x="24" y="30" fill="#93c5fd" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" letterSpacing="2">
          VERIFICAÇÃO ON-CHAIN
        </text>
        <text x="24" y="60" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">
          Contrato: {compactAddress(blockchain.contractAddress, 12, 8)}
        </text>
        <text x="24" y="88" fill="#cbd5e1" fontFamily="Arial, Helvetica, sans-serif" fontSize="16">
          Chain ID: {blockchain.chainId || 137} • Explorer: {explorerUrl}
        </text>
        <text x="24" y="110" fill="#cbd5e1" fontFamily="Arial, Helvetica, sans-serif" fontSize="14">
          TX: {compactAddress(blockchain.transactionHash, 12, 8) || '—'}
        </text>
      </g>

      <FooterBar />
    </svg>
  );
}

/**
 * Arte oficial A4 paisagem do certificado com frente e verso.
 * O parametro `page` controla qual pagina e renderizada: 'front' | 'back'.
 */
export default function CertificateSvg({ manifest, draft = false, className = '', page = 'front' }) {
  if (page === 'back') {
    return <CertificateBackPage manifest={manifest} className={className} />;
  }
  return <CertificateFrontPage manifest={manifest} draft={draft} className={className} />;
}
