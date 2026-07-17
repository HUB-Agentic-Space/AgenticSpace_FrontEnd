'use client';

/**
 * Utilitarios de exportacao e leitura dos certificados Rapport.
 *
 * O diploma nasce como SVG. Para o download em PDF, o SVG e renderizado em
 * alta resolucao e inserido em uma pagina A4 paisagem. O manifesto canonico
 * tambem e gravado nos metadados do PDF, permitindo que a pagina publica o
 * recupere sem enviar o documento a terceiros.
 */

export const CERTIFICATE_PDF_MARKER = 'RAPPORT_CERTIFICATE_V1:';
export const CERTIFICATE_SVG_METADATA_ID = 'rapport-certificate-manifest';
export const MAX_CERTIFICATE_FILE_BYTES = 15 * 1024 * 1024;

const PDF_GUIDANCE_LINKS = [
  {
    label: 'VALIDAR do ITI',
    url: 'https://validar.iti.gov.br/',
  },
  {
    label: 'Instruções oficiais de assinatura eletrônica do gov.br',
    url: 'https://www.gov.br/governodigital/pt-br/identidade/assinatura-eletronica',
  },
  {
    label: 'Serviço oficial de validação de assinaturas eletrônicas',
    url: 'https://www.gov.br/pt-br/servicos/validar-servico-de-validacao-de-assinaturas-eletronicas',
  },
];

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Codifica o manifesto como Base64 URL-safe sem padding. */
export function encodeCertificateManifest(manifest) {
  const json = JSON.stringify(manifest);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Decodifica e valida superficialmente um manifesto serializado. */
export function decodeCertificateManifest(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('O arquivo nao contem um manifesto de certificado.');
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const bytes = base64ToBytes(`${normalized}${padding}`);
  const manifest = JSON.parse(new TextDecoder().decode(bytes));
  if (!manifest || manifest.version !== 1 || typeof manifest.certificate !== 'object') {
    throw new Error('O manifesto do certificado possui formato desconhecido.');
  }
  return manifest;
}

function readHref(image) {
  return image.getAttribute('href') || image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Nao foi possivel incorporar um dos logos.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Clona o SVG e incorpora todas as imagens externas como data URI, deixando o
 * arquivo autocontido para download e conversao em PDF.
 */
export async function serializeCertificateSvg(svgElement) {
  if (!(svgElement instanceof SVGElement)) {
    throw new Error('A arte SVG do certificado nao esta disponivel.');
  }

  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const images = Array.from(clone.querySelectorAll('image'));
  await Promise.all(images.map(async (image) => {
    const href = readHref(image);
    if (!href || href.startsWith('data:')) return;
    const absoluteUrl = new URL(href, window.location.href);
    if (absoluteUrl.origin !== window.location.origin) {
      throw new Error('O certificado referencia um logo fora do dominio do site.');
    }
    const response = await fetch(absoluteUrl.toString(), { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Falha ao carregar o logo (${response.status}).`);
    const dataUrl = await blobToDataUrl(await response.blob());
    image.setAttribute('href', dataUrl);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
  }));

  return new XMLSerializer().serializeToString(clone);
}

async function renderSvgToPng(svgText) {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('O navegador nao conseguiu renderizar o SVG.'));
      element.src = objectUrl;
    });

    // Aproximadamente 240 dpi para uma folha A4 paisagem.
    const canvas = document.createElement('canvas');
    canvas.width = 2800;
    canvas.height = 1980;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D indisponivel neste navegador.');
    context.fillStyle = '#f8f4ea';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Falha ao gerar a imagem do PDF.')),
        'image/png'
      );
    });
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function safeFilenamePart(value) {
  return String(value || 'certificado')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'certificado';
}

function downloadBytes(bytes, type, filename) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawWrappedText(page, text, {
  font,
  size,
  x,
  y,
  maxWidth,
  lineHeight,
  color,
}) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - (index * lineHeight),
      size,
      font,
      color,
    });
  });

  return y - (lines.length * lineHeight);
}

function addExternalLinkAnnotation(pdf, page, PDFString, { x, y, width, height, url }) {
  const annotation = pdf.context.register(pdf.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(url),
    },
  }));
  page.node.addAnnot(annotation);
}

/**
 * Acrescenta uma pagina documental separada da arte do diploma. As URLs ficam
 * visiveis para a copia impressa e tambem recebem anotacoes de link no PDF.
 */
async function addSignatureGuidancePage(pdf, pdfLib) {
  const { PDFString, StandardFonts, rgb } = pdfLib;
  const page = pdf.addPage([841.8898, 595.2756]);
  const width = page.getWidth();
  const height = page.getHeight();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0, 0.004, 0.118);
  const slate = rgb(0.2, 0.255, 0.333);
  const muted = rgb(0.392, 0.455, 0.545);
  const blue = rgb(0.145, 0.388, 0.922);
  const paleBlue = rgb(0.937, 0.965, 1);
  const border = rgb(0.797, 0.835, 0.882);
  const paper = rgb(0.973, 0.98, 0.988);
  const margin = 48;
  const contentWidth = width - (margin * 2);

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
  page.drawRectangle({ x: 0, y: height - 132, width, height: 132, color: navy });
  page.drawRectangle({ x: margin, y: height - 137, width: 112, height: 5, color: blue });

  page.drawText('CERTIFICADO DIGITAL - LEIA ANTES DE ASSINAR', {
    x: margin,
    y: height - 45,
    size: 10,
    font: bold,
    color: rgb(0.576, 0.773, 0.992),
  });
  page.drawText('Orientações para assinatura e validação', {
    x: margin,
    y: height - 82,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText('Esta página acompanha o diploma e não substitui a validação oficial da assinatura.', {
    x: margin,
    y: height - 109,
    size: 11,
    font: regular,
    color: rgb(0.797, 0.835, 0.882),
  });

  page.drawRectangle({
    x: margin,
    y: 316,
    width: contentWidth,
    height: 124,
    color: rgb(1, 1, 1),
    borderColor: border,
    borderWidth: 1,
  });
  page.drawText('Importante', {
    x: margin + 20,
    y: 412,
    size: 13,
    font: bold,
    color: navy,
  });
  let paragraphY = drawWrappedText(
    page,
    'A assinatura PAdES precisa continuar sendo validada no VALIDAR do ITI; a aplicação comprova separadamente o vínculo e o hash on-chain.',
    {
      x: margin + 20,
      y: 386,
      maxWidth: contentWidth - 40,
      size: 11.5,
      lineHeight: 16,
      font: regular,
      color: slate,
    }
  );
  drawWrappedText(
    page,
    'O gov.br também orienta preservar o PDF digital, sem “imprimir como PDF” depois de assinar.',
    {
      x: margin + 20,
      y: paragraphY - 4,
      maxWidth: contentWidth - 40,
      size: 11.5,
      lineHeight: 16,
      font: bold,
      color: slate,
    }
  );

  page.drawText('Como proceder', {
    x: margin,
    y: 286,
    size: 13,
    font: bold,
    color: navy,
  });
  [
    '1. Assine o PDF digital original pelo serviço de assinatura escolhido.',
    '2. Guarde o arquivo assinado; não o reconverta nem use a opção “imprimir como PDF”.',
    '3. Valide a assinatura PAdES no ITI e confira, separadamente, o NFT e o hash on-chain no Agentic Space.',
  ].forEach((instruction, index) => {
    page.drawText(instruction, {
      x: margin,
      y: 260 - (index * 22),
      size: 10.5,
      font: index === 1 ? bold : regular,
      color: slate,
    });
  });

  page.drawText('Referências oficiais - clique em qualquer bloco para abrir', {
    x: margin,
    y: 186,
    size: 11,
    font: bold,
    color: navy,
  });

  PDF_GUIDANCE_LINKS.forEach((link, index) => {
    const boxY = 130 - (index * 48);
    page.drawRectangle({
      x: margin,
      y: boxY,
      width: contentWidth,
      height: 41,
      color: paleBlue,
      borderColor: rgb(0.749, 0.835, 0.988),
      borderWidth: 0.8,
    });
    page.drawText(link.label, {
      x: margin + 14,
      y: boxY + 24,
      size: 9.5,
      font: bold,
      color: blue,
    });
    page.drawText(link.url, {
      x: margin + 14,
      y: boxY + 9,
      size: 7.6,
      font: regular,
      color: muted,
    });
    addExternalLinkAnnotation(pdf, page, PDFString, {
      x: margin,
      y: boxY,
      width: contentWidth,
      height: 41,
      url: link.url,
    });
  });
}

/** Gera e baixa o diploma PDF com o manifesto verificavel nos metadados. */
export async function downloadCertificatePdf(svgElement, manifest) {
  const svgText = await serializeCertificateSvg(svgElement);
  const pngBytes = await renderSvgToPng(svgText);
  const pdfLib = await import('pdf-lib');
  const { PDFDocument } = pdfLib;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.8898, 595.2756]);
  const artwork = await pdf.embedPng(pngBytes);
  page.drawImage(artwork, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  await addSignatureGuidancePage(pdf, pdfLib);

  const payload = `${CERTIFICATE_PDF_MARKER}${encodeCertificateManifest(manifest)}`;
  pdf.setTitle(`Certificado ${manifest.certificate.phaseTitle} - ${manifest.certificate.recipientName}`);
  pdf.setAuthor('Raport Tecnologia Inova Simples');
  pdf.setSubject(payload);
  pdf.setKeywords(['Rapport', 'Agentic Space', 'ERC-721', 'ERC-6551', payload]);
  pdf.setCreator('Agentic Space');
  pdf.setProducer('Agentic Space Certificate Studio');
  const issuedAt = Number(manifest.certificate.issuedAt || 0);
  if (issuedAt > 0) pdf.setCreationDate(new Date(issuedAt * 1000));

  const pdfBytes = await pdf.save({ useObjectStreams: true });
  const filename = `certificado-${safeFilenamePart(manifest.certificate.recipientName)}-${manifest.certificate.tokenId}.pdf`;
  downloadBytes(pdfBytes, 'application/pdf', filename);
}

/** Baixa a versao SVG autocontida, util para arquivo e impressao vetorial. */
export async function downloadCertificateSvg(svgElement, manifest) {
  const svgText = await serializeCertificateSvg(svgElement);
  const filename = `certificado-${safeFilenamePart(manifest.certificate.recipientName)}-${manifest.certificate.tokenId}.svg`;
  downloadBytes(new TextEncoder().encode(svgText), 'image/svg+xml;charset=utf-8', filename);
}

function findMarkedPayload(values) {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const markerIndex = value.indexOf(CERTIFICATE_PDF_MARKER);
    if (markerIndex >= 0) {
      return value.slice(markerIndex + CERTIFICATE_PDF_MARKER.length).split(/[\s,]/, 1)[0];
    }
  }
  return '';
}

/** Extrai o manifesto de um PDF gerado pelo site, inclusive apos assinatura incremental. */
export async function extractManifestFromPdf(file) {
  if (file.size > MAX_CERTIFICATE_FILE_BYTES) {
    throw new Error('O PDF excede o limite de 15 MB.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder('ascii').decode(bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('O arquivo selecionado nao possui uma assinatura PDF valida.');
  }

  const { PDFDocument } = await import('pdf-lib');
  let pdf;
  try {
    pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    throw new Error('Nao foi possivel ler este PDF. Ele pode estar corrompido ou protegido por senha.');
  }
  const payload = findMarkedPayload([pdf.getSubject(), ...(pdf.getKeywords() || '').split(/\s+/)]);
  if (!payload) {
    throw new Error('Este PDF nao contem o manifesto verificavel emitido pelo Agentic Space.');
  }
  return decodeCertificateManifest(payload);
}

/** Extrai o manifesto de um SVG baixado pelo site. */
export async function extractManifestFromSvg(file) {
  if (file.size > MAX_CERTIFICATE_FILE_BYTES) {
    throw new Error('O SVG excede o limite de 15 MB.');
  }
  const text = await file.text();
  const documentNode = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (documentNode.querySelector('parsererror')) throw new Error('O SVG esta corrompido.');
  const metadata = documentNode.getElementById(CERTIFICATE_SVG_METADATA_ID)?.textContent?.trim();
  if (!metadata?.startsWith(CERTIFICATE_PDF_MARKER)) {
    throw new Error('Este SVG nao contem o manifesto verificavel do Agentic Space.');
  }
  return decodeCertificateManifest(metadata.slice(CERTIFICATE_PDF_MARKER.length));
}

export async function extractCertificateManifest(file) {
  const lowerName = file.name.toLowerCase();
  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return extractManifestFromPdf(file);
  }
  if (file.type === 'image/svg+xml' || lowerName.endsWith('.svg')) {
    return extractManifestFromSvg(file);
  }
  throw new Error('Envie um certificado em PDF ou SVG.');
}
