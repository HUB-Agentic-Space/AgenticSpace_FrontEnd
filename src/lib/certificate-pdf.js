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

import { markdownToPlainText, parseMarkdown } from './markdown-utils';
import { ISSUER } from './certificates';

/**
 * Replaces Unicode characters not encodable in WinAnsi (pdf-lib StandardFonts)
 * with ASCII-safe equivalents. Box-drawing and other special chars commonly
 * found in code blocks/diagrams are mapped to close ASCII alternatives.
 */
const WIN_ANSI_REPLACEMENTS = {
  '\u2500': '-',   // ─ horizontal line
  '\u2501': '=',   // ━ heavy horizontal
  '\u2502': '|',   // │ vertical line
  '\u2503': '|',   // ┃ heavy vertical
  '\u250c': '+',   // ┌ corner
  '\u250f': '+',   // ┏ heavy corner
  '\u2510': '+',   // ┐ corner
  '\u2513': '+',   // ┓ heavy corner
  '\u2514': '+',   // └ corner
  '\u2517': '+',   // ┗ heavy corner
  '\u2518': '+',   // ┘ corner
  '\u251b': '+',   // ┛ heavy corner
  '\u251c': '+',   // ├ tee
  '\u251d': '+',   // ┝ tee
  '\u2523': '+',   // ┣ heavy tee
  '\u2524': '+',   // ┤ tee
  '\u2525': '+',   // ┥ tee
  '\u252b': '+',   // ┫ heavy tee
  '\u252c': '+',   // ┬ tee top
  '\u2533': '+',   // ┳ heavy tee top
  '\u2534': '+',   // ┴ tee bottom
  '\u253b': '+',   // ┻ heavy tee bottom
  '\u253c': '+',   // ┼ cross
  '\u254b': '+',   // ┿ heavy cross
  '\u2550': '=',   // ═ double horizontal
  '\u2551': '|',   // ║ double vertical
  '\u2554': '+',   // ╔ double corner
  '\u2557': '+',   // ╗ double corner
  '\u255a': '+',   // ╚ double corner
  '\u255d': '+',   // ╝ double corner
  '\u2560': '+',   // ╠ double tee
  '\u2563': '+',   // ╣ double tee
  '\u2566': '+',   // ╦ double tee top
  '\u2569': '+',   // ╩ double tee bottom
  '\u256c': '+',   // ╬ double cross
  '\u2591': ' ',   // ░ light shade
  '\u2592': ' ',   // ▒ medium shade
  '\u2593': ' ',   // ▓ dark shade
  '\u2588': '#',   // █ full block
  '\u25a0': '*',   // ■ black square
  '\u25a1': '*',   // □ white square
  '\u2022': '*',   // • bullet (already handled in lists, but may appear inline)
  '\u2026': '...', // … ellipsis
  '\u2014': '--',  // — em dash
  '\u2013': '-',   // – en dash
  '\u2018': "'",   // ' left single quote
  '\u2019': "'",   // ' right single quote
  '\u201c': '"',   // " left double quote
  '\u201d': '"',   // " right double quote
  '\u00a0': ' ',   // non-breaking space
  '\u00ab': '<<',  // «
  '\u00bb': '>>',  // »
  '\u2026': '...', // … (duplicate safety)
};

function sanitizeForWinAnsi(text) {
  if (!text) return '';
  return String(text).replace(/[\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2022\u2026\u2014\u2013\u2018\u2019\u201C\u201D\u00A0\u00AB\u00BB]/g, (ch) => {
    return WIN_ANSI_REPLACEMENTS[ch] ?? '';
  });
}

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
  const paragraphs = String(text).split('\n');
  const lines = [];
  let currentLine = '';

  for (const para of paragraphs) {
    if (para.trim() === '') {
      if (currentLine) { lines.push(currentLine); currentLine = ''; }
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (currentLine && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) { lines.push(currentLine); currentLine = ''; }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    if (line === '') return;
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
async function addSignatureGuidancePage(pdf, pdfLib, manifest) {
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
  const gold = rgb(0.722, 0.435, 0.024);
  const paleGold = rgb(0.973, 0.945, 0.875);
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

  const skillsText = manifest?.certificate?.skillsDescription || '';
  if (skillsText) {
    const skillsBoxY = height - 300;
    const skillsBoxHeight = 140;

    page.drawRectangle({
      x: margin,
      y: skillsBoxY - skillsBoxHeight,
      width: contentWidth,
      height: skillsBoxHeight,
      color: paleGold,
      borderColor: gold,
      borderWidth: 1,
    });

    page.drawText('HABILIDADES CONQUISTADAS', {
      x: margin + 20,
      y: skillsBoxY - 28,
      size: 13,
      font: bold,
      color: gold,
    });

    drawWrappedText(page, markdownToPlainText(skillsText), {
      x: margin + 20,
      y: skillsBoxY - 52,
      maxWidth: contentWidth - 40,
      size: 11.5,
      lineHeight: 16,
      font: regular,
      color: slate,
    });
  }

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

/** Gera e baixa o diploma PDF com frente, verso e manifesto nos metadados. */
export async function downloadCertificatePdf(frontSvg, backSvg, manifest) {
  const pdfLib = await import('pdf-lib');
  const { PDFDocument } = pdfLib;
  const pdf = await PDFDocument.create();

  const frontSvgText = await serializeCertificateSvg(frontSvg);
  const frontPng = await renderSvgToPng(frontSvgText);
  const frontPage = pdf.addPage([841.8898, 595.2756]);
  const frontArtwork = await pdf.embedPng(frontPng);
  frontPage.drawImage(frontArtwork, { x: 0, y: 0, width: frontPage.getWidth(), height: frontPage.getHeight() });

  if (backSvg) {
    const backSvgText = await serializeCertificateSvg(backSvg);
    const backPng = await renderSvgToPng(backSvgText);
    const backPage = pdf.addPage([841.8898, 595.2756]);
    const backArtwork = await pdf.embedPng(backPng);
    backPage.drawImage(backArtwork, { x: 0, y: 0, width: backPage.getWidth(), height: backPage.getHeight() });
  }

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

async function fetchLogoPng() {
  try {
    const response = await fetch('/images/logo-rapport-2026.png', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return null;
  }
}

function drawMarkdownBlocks(page, md, {
  font, boldFont, x, y, maxWidth, baseSize, lineHeight, color, headingColor,
  pdf: pdfDoc, pageHeight, marginTop, marginBottom, drawHeader,
  monoFont, rgb,
}) {
  const blocks = parseMarkdown(md);
  let cursorY = y;
  let currentPage = page;
  const bottomLimit = marginBottom || 80;
  const topY = pageHeight ? pageHeight - (marginTop || 48) : y;

  function ensureSpace(needed) {
    if (cursorY - needed >= bottomLimit) return;
    if (!pdfDoc) return;
    currentPage = pdfDoc.addPage([page.getWidth(), page.getHeight()]);
    if (drawHeader) drawHeader(currentPage);
    cursorY = topY;
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const headingSize = baseSize + (6 - Math.min(block.level, 4));
        const lines = wrapText(font, sanitizeForWinAnsi(block.text), headingSize, maxWidth);
        for (const line of lines) {
          ensureSpace(lineHeight);
          if (cursorY < bottomLimit) break;
          currentPage.drawText(line, { x, y: cursorY, size: headingSize, font: boldFont, color: headingColor });
          cursorY -= lineHeight;
        }
        cursorY -= lineHeight * 0.3;
        break;
      }
      case 'paragraph': {
        const lines = wrapText(font, sanitizeForWinAnsi(block.text), baseSize, maxWidth);
        for (const line of lines) {
          ensureSpace(lineHeight);
          if (cursorY < bottomLimit) break;
          currentPage.drawText(line, { x, y: cursorY, size: baseSize, font, color });
          cursorY -= lineHeight;
        }
        cursorY -= lineHeight * 0.2;
        break;
      }
      case 'list': {
        for (let j = 0; j < block.items.length; j++) {
          ensureSpace(lineHeight);
          if (cursorY < bottomLimit) break;
          const prefix = block.ordered ? `${j + 1}. ` : '* ';
          const fullText = `${prefix}${sanitizeForWinAnsi(block.items[j])}`;
          const lines = wrapText(font, fullText, baseSize, maxWidth);
          for (let k = 0; k < lines.length; k++) {
            ensureSpace(lineHeight);
            if (cursorY < bottomLimit) break;
            const indent = k > 0 ? 18 : 0;
            currentPage.drawText(lines[k], { x: x + indent, y: cursorY, size: baseSize, font, color });
            cursorY -= lineHeight;
          }
        }
        cursorY -= lineHeight * 0.2;
        break;
      }
      case 'code': {
        const codeFont = monoFont || font;
        const codeSize = baseSize - 0.5;
        const codeLineHeight = lineHeight - 1;
        const codePadX = 10;
        const codePadY = 8;
        const codeLines = sanitizeForWinAnsi(block.text).split('\n');
        const codeMaxWidth = maxWidth - (codePadX * 2);
        const wrappedCode = [];
        for (const rawLine of codeLines) {
          if (rawLine.trim() === '') {
            wrappedCode.push('');
          } else {
            const wrapped = wrapText(codeFont, rawLine, codeSize, codeMaxWidth);
            for (const wl of wrapped) wrappedCode.push(wl);
          }
        }
        const blockHeight = wrappedCode.length * codeLineHeight + (codePadY * 2);
        ensureSpace(blockHeight + lineHeight);
        if (cursorY - blockHeight < bottomLimit && pdfDoc) {
          currentPage = pdfDoc.addPage([page.getWidth(), page.getHeight()]);
          if (drawHeader) drawHeader(currentPage);
          cursorY = topY;
        }
        const bgY = cursorY - blockHeight + codePadY;
        currentPage.drawRectangle({
          x: x - 4,
          y: bgY - codePadY,
          width: maxWidth + 8,
          height: blockHeight,
          color: rgb(0.93, 0.93, 0.95),
          borderColor: rgb(0.75, 0.75, 0.78),
          borderWidth: 0.5,
        });
        let codeY = cursorY - codePadY;
        for (const codeLine of wrappedCode) {
          if (codeY < bottomLimit) break;
          if (codeLine) {
            currentPage.drawText(codeLine, {
              x: x + codePadX,
              y: codeY,
              size: codeSize,
              font: codeFont,
              color: rgb(0.15, 0.15, 0.18),
            });
          }
          codeY -= codeLineHeight;
        }
        cursorY = codeY - codePadY - lineHeight * 0.3;
        break;
      }
    }
  }
  return { page: currentPage, cursorY };
}

function wrapText(font, text, size, maxWidth) {
  const paragraphs = String(text).split('\n');
  const lines = [];
  let currentLine = '';

  for (const para of paragraphs) {
    if (para.trim() === '') {
      if (currentLine) { lines.push(currentLine); currentLine = ''; }
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (currentLine && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) { lines.push(currentLine); currentLine = ''; }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Gera e baixa um PDF com as instrucoes de um desafio, permitindo que o
 * usuario siga as orientacoes offline ou imprima. O documento inclui o
 * logo da Rapport no header, o titulo "Desafio", o nome do desafio como
 * subtitulo, as habilidades e instrucoes, e os dados da empresa no rodape.
 */
export async function downloadChallengeInstructionsPdf(challenge) {
  const pdfLib = await import('pdf-lib');
  const { PDFDocument, StandardFonts, rgb } = pdfLib;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const width = page.getWidth();
  const height = page.getHeight();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const brandOrange = rgb(0.941, 0.373, 0.251);
  const dark = rgb(0.133, 0.133, 0.133);
  const slate = rgb(0.2, 0.255, 0.333);
  const muted = rgb(0.392, 0.455, 0.545);
  const paper = rgb(1, 1, 1);
  const margin = 48;
  const contentWidth = width - (margin * 2);

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper });

  const logoBytes = await fetchLogoPng();
  let logoHeight = 0;
  if (logoBytes) {
    try {
      const logo = await pdf.embedPng(logoBytes);
      const logoW = 140;
      const logoH = (logo.height / logo.width) * logoW;
      page.drawImage(logo, { x: margin, y: height - margin - logoH, width: logoW, height: logoH });
      logoHeight = logoH;
    } catch {
      // Skip logo if embedding fails
    }
  }

  page.drawRectangle({ x: 0, y: height - margin - logoHeight - 12, width, height: 3, color: brandOrange });
  const headerBottom = height - margin - logoHeight - 20;

  page.drawText('Desafio', {
    x: margin,
    y: headerBottom - 36,
    size: 28,
    font: bold,
    color: dark,
  });

  page.drawText(sanitizeForWinAnsi(challenge.name || 'Desafio'), {
    x: margin,
    y: headerBottom - 60,
    size: 16,
    font: regular,
    color: brandOrange,
  });

  let contentY = headerBottom - 90;

  function drawPageHeader(p) {
    p.drawRectangle({ x: 0, y: 0, width: p.getWidth(), height: p.getHeight(), color: paper });
  }

  function drawSectionDivider(p, y) {
    p.drawRectangle({ x: margin, y: y - 8, width: contentWidth, height: 4, color: brandOrange });
  }

  function drawSectionTitle(p, y, title) {
    p.drawText(title, { x: margin, y, size: 13, font: bold, color: brandOrange });
  }

  function drawFooter(p) {
    const footerY = 50;
    p.drawRectangle({ x: 0, y: 0, width: p.getWidth(), height: footerY + 10, color: dark });
    p.drawRectangle({ x: 0, y: footerY + 10, width: p.getWidth(), height: 2, color: brandOrange });
    p.drawText(ISSUER.legalName, { x: margin, y: footerY - 6, size: 9, font: bold, color: rgb(1, 1, 1) });
    p.drawText(`CNPJ: ${ISSUER.cnpj}`, { x: margin, y: footerY - 20, size: 8, font: regular, color: muted });
    const websiteText = `${ISSUER.website}  |  ${ISSUER.agenticSpaceWebsite}`;
    const websiteWidth = bold.widthOfTextAtSize(websiteText, 8);
    p.drawText(websiteText, { x: p.getWidth() - margin - websiteWidth, y: footerY - 20, size: 8, font: regular, color: muted });
  }

  let currentPage = page;

  if (challenge.skillsDescription) {
    drawSectionDivider(currentPage, contentY);
    contentY -= 24;
    drawSectionTitle(currentPage, contentY, 'HABILIDADES ADQUIRIDAS');
    contentY -= 22;

    const result = drawMarkdownBlocks(currentPage, challenge.skillsDescription, {
      font: regular,
      boldFont: bold,
      monoFont: mono,
      rgb,
      x: margin,
      y: contentY,
      maxWidth: contentWidth,
      baseSize: 11.5,
      lineHeight: 17,
      color: slate,
      headingColor: dark,
      pdf,
      pageHeight: height,
      marginTop: margin,
      marginBottom: 70,
      drawHeader: drawPageHeader,
    });
    currentPage = result.page;
    contentY = result.cursorY;
    contentY -= 16;
  }

  if (challenge.instructions) {
    if (contentY < 100) {
      currentPage = pdf.addPage([width, height]);
      drawPageHeader(currentPage);
      contentY = height - margin;
    }
    drawSectionDivider(currentPage, contentY);
    contentY -= 24;
    drawSectionTitle(currentPage, contentY, 'INSTRUÇÕES');
    contentY -= 22;

    const result = drawMarkdownBlocks(currentPage, challenge.instructions, {
      font: regular,
      boldFont: bold,
      monoFont: mono,
      rgb,
      x: margin,
      y: contentY,
      maxWidth: contentWidth,
      baseSize: 11.5,
      lineHeight: 17,
      color: slate,
      headingColor: dark,
      pdf,
      pageHeight: height,
      marginTop: margin,
      marginBottom: 70,
      drawHeader: drawPageHeader,
    });
    currentPage = result.page;
    contentY = result.cursorY;
  }

  const pages = pdf.getPages();
  for (const p of pages) {
    drawFooter(p);
  }

  pdf.setTitle(`Desafio: ${challenge.name || 'Desafio'}`);
  pdf.setAuthor(ISSUER.legalName);
  pdf.setSubject('Instruções do Desafio');
  pdf.setCreator('Agentic Space');
  pdf.setProducer('Agentic Space Challenge Studio');
  pdf.setCreationDate(new Date());

  const pdfBytes = await pdf.save({ useObjectStreams: true });
  const filename = `desafio-${safeFilenamePart(challenge.name)}-instrucoes.pdf`;
  downloadBytes(pdfBytes, 'application/pdf', filename);
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
