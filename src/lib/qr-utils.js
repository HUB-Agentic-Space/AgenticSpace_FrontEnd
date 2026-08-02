'use client';

import QRCode from 'qrcode';

/**
 * Gera um QR code como string SVG (sem o tag <svg> externo, apenas o
 * conteudo interno: paths). Retorna uma Promise<string>.
 *
 * @param {string} text - URL ou texto a codificar
 * @param {object} opts - opcoes { margin, color, background }
 * @returns {Promise<string>} SVG inner content
 */
export async function generateQrSvgInner(text, opts = {}) {
  const {
    margin = 1,
    color = '#000000',
    background = '#ffffff',
  } = opts;

  const svgString = await QRCode.toString(text, {
    type: 'svg',
    margin,
    color: { dark: color, light: background },
    errorCorrectionLevel: 'M',
  });

  // O modulo qrcode retorna um <svg> completo. Extraimos o conteudo interno.
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1].trim() : svgString;
}

/**
 * Gera um QR code como data URL para uso em <image href>.
 * @param {string} text
 * @param {object} opts
 * @returns {Promise<string>} data:image/svg+xml;base64,...
 */
export async function generateQrDataUrl(text, opts = {}) {
  const {
    margin = 1,
    color = '#000000',
    background = '#ffffff',
    width = 200,
  } = opts;

  return QRCode.toDataURL(text, {
    margin,
    width,
    color: { dark: color, light: background },
    errorCorrectionLevel: 'M',
  });
}
