/**
 * @file markdown-utils.js
 * @description Lightweight Markdown parser utilities for rendering
 *              skillsDescription and instructions fields as formatted
 *              text in HTML (frontend), SVG (certificate), and PDF.
 *
 *              Supports: headings, bold, italic, bullet lists, numbered
 *              lists, line breaks, and paragraphs.
 *
 * Padrão: Strategy (different output formats from same AST)
 */

/**
 * Parse markdown text into a simple AST of block nodes.
 * Each node is one of:
 *   { type: 'heading', level: 1-6, text: string }
 *   { type: 'paragraph', text: string }
 *   { type: 'list', ordered: bool, items: string[] }
 *   { type: 'spacer' }
 *
 * @param {string} md - Raw markdown text
 * @returns {Array} Array of block nodes
 */
export function parseMarkdown(md) {
  if (!md || typeof md !== 'string') return [];

  const lines = md.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading: # Title, ## Title, etc.
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: stripInline(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(stripInline(lines[i].replace(/^\d+\.\s+/, '')));
        i++;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Unordered list: - item or * item
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(stripInline(lines[i].replace(/^[-*]\s+/, '')));
        i++;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: stripInline(paraLines.join(' ')),
      });
    }
  }

  return blocks;
}

/**
 * Strip inline markdown formatting (bold/italic) and return plain text.
 * Converts **bold** and *italic* to plain text.
 */
function stripInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .trim();
}

/**
 * Convert markdown to plain text with line breaks, suitable for PDF rendering.
 * Each block is separated by a blank line. List items are prefixed with bullet
 * or number.
 *
 * @param {string} md - Raw markdown text
 * @returns {string} Plain text with line breaks
 */
export function markdownToPlainText(md) {
  const blocks = parseMarkdown(md);
  const lines = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        lines.push(block.text.toUpperCase());
        break;
      case 'paragraph':
        lines.push(block.text);
        break;
      case 'list':
        for (let j = 0; j < block.items.length; j++) {
          const prefix = block.ordered ? `${j + 1}. ` : '• ';
          lines.push(`${prefix}${block.items[j]}`);
        }
        break;
    }
    lines.push(''); // blank line between blocks
  }

  return lines.join('\n').trim();
}

/**
 * Convert markdown to simple HTML string (for dangerouslySetInnerHTML).
 * This is a minimal, safe converter — no raw HTML is passed through.
 *
 * @param {string} md - Raw markdown text
 * @returns {string} HTML string
 */
export function markdownToHtml(md) {
  const blocks = parseMarkdown(md);
  const htmlParts = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const tag = `h${Math.min(block.level, 4)}`;
        htmlParts.push(`<${tag}>${escapeHtml(block.text)}</${tag}>`);
        break;
      }
      case 'paragraph':
        htmlParts.push(`<p>${escapeHtml(block.text)}</p>`);
        break;
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
        htmlParts.push(`<${tag}>${items}</${tag}>`);
        break;
      }
    }
  }

  return htmlParts.join('');
}

/**
 * Convert markdown to SVG text elements (array of { text, fontSize, fontWeight, y }).
 * Each element represents a line to be drawn in the SVG certificate.
 *
 * @param {string} md - Raw markdown text
 * @param {object} opts - { startX, startY, lineHeight, maxWidth, fontSize }
 * @returns {Array} Array of { text, x, y, fontSize, fontWeight } elements
 */
export function markdownToSvgElements(md, opts = {}) {
  const {
    startX = 0,
    startY = 0,
    lineHeight = 20,
    fontSize = 14,
  } = opts;

  const blocks = parseMarkdown(md);
  const elements = [];
  let y = startY;

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        elements.push({
          text: block.text,
          x: startX,
          y,
          fontSize: fontSize + (6 - block.level),
          fontWeight: '700',
        });
        y += lineHeight;
        break;
      case 'paragraph':
        elements.push({
          text: block.text,
          x: startX,
          y,
          fontSize,
          fontWeight: '400',
        });
        y += lineHeight;
        break;
      case 'list':
        for (let j = 0; j < block.items.length; j++) {
          const prefix = block.ordered ? `${j + 1}. ` : '• ';
          elements.push({
            text: `${prefix}${block.items[j]}`,
            x: startX,
            y,
            fontSize,
            fontWeight: '400',
          });
          y += lineHeight;
        }
        break;
    }
    y += lineHeight / 2; // extra spacing between blocks
  }

  return elements;
}

function escapeHtml(text) {
  const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, (c) => div[c]);
}
