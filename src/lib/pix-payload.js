/**
 * @file lib/pix-payload.js
 * @description Gerador de payload PIX "copia e cola" no padrão EMV/BR Code do
 * Banco Central do Brasil, com CRC16-CCITT. Usado para montar o QR Code de
 * doações da Rapport Tecnologia.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

/** Chave PIX (CNPJ) da Rapport Tecnologia, somente dígitos. */
export const PIX_KEY = '67904299000180';

/** Chave PIX formatada para exibição. */
export const PIX_KEY_DISPLAY = '67.904.299/0001-80';

const PIX_GUI = 'br.gov.bcb.pix';
const MERCHANT_NAME = 'RAPPORT TECNOLOGIA';
const MERCHANT_CITY = 'FORTALEZA';

/**
 * Monta um campo EMV no formato ID + tamanho (2 dígitos) + valor.
 * @param {string} id - Identificador do campo (2 dígitos).
 * @param {string} value - Valor do campo.
 * @returns {string} Campo EMV serializado.
 */
function emvField(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/**
 * CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) conforme especificação
 * do BR Code. Calculado sobre todo o payload incluindo o marcador "6304".
 * @param {string} str - Payload parcial terminando em "6304".
 * @returns {string} CRC16 em hexadecimal maiúsculo com 4 dígitos.
 */
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i += 1) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload PIX "copia e cola" (BR Code) de valor aberto para a chave
 * CNPJ da Rapport Tecnologia.
 *
 * @param {object} [opts] - Opções do payload.
 * @param {string} [opts.amount] - Valor em BRL com ponto decimal (ex.: "5.00").
 *   Quando omitido, o QR fica com valor aberto (o pagador digita o valor).
 * @param {string} [opts.txid] - Identificador da transação (até 25 chars).
 * @returns {string} Payload EMV completo, pronto para QR Code ou copia-e-cola.
 */
export function generatePixPayload(opts = {}) {
  const { amount, txid = '***' } = opts;

  const merchantAccount = emvField('26',
    emvField('00', PIX_GUI) + emvField('01', PIX_KEY));

  const additionalData = emvField('62', emvField('05', txid));

  let payload =
    emvField('00', '01') +
    merchantAccount +
    emvField('52', '0000') +
    emvField('53', '986') +
    (amount ? emvField('54', amount) : '') +
    emvField('58', 'BR') +
    emvField('59', MERCHANT_NAME) +
    emvField('60', MERCHANT_CITY) +
    additionalData +
    '6304';

  return payload + crc16(payload);
}
