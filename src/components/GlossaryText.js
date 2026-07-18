'use client';

/**
 * @file GlossaryText.js
 * @description Componente que processa texto e envolve termos técnicos
 *              conhecidos com <GlossaryTooltip>. Pode ser usado inline
 *              em páginas React ou como renderer do ReactMarkdown.
 */

import { useMemo } from 'react';
import { useTranslations } from '@/lib/LocaleProvider';
import GlossaryTooltip from '@/components/GlossaryTooltip';

const GLOSSARY_TERMS = [
  'ERC-20',
  'ERC-721',
  'ERC-6551',
  'EIP-712',
  'EIP-2535',
  'EIP-8004',
  'Polygon PoS',
  'Diamond Proxy',
  'InfrastructureFund',
  'Merkle Tree',
  'Verifiable Credential',
  'RapportCertificate',
  'CASSwap',
  'Blockchain Broker',
  'Handshake',
  'Relayer',
  'Swap Fee',
  'AUID',
  'NFT',
  'TBA',
  'UUPS',
  'DAO',
  'BPS',
  'Gas',
  'DID',
  'VC',
  'P2P',
  'A2A',
  'CAS',
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTermRegex(terms) {
  const escaped = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  return new RegExp(`(${escaped.join('|')})`, 'g');
}

export function GlossaryText({ children }) {
  const t = useTranslations();

  const regex = useMemo(() => buildTermRegex(GLOSSARY_TERMS), []);

  const text = typeof children === 'string' ? children : '';

  if (!text) return children;

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (GLOSSARY_TERMS.includes(part)) {
          const definition = t(`glossary.${part}`);
          if (!definition || definition === `glossary.${part}`) {
            return <span key={i}>{part}</span>;
          }
          return (
            <GlossaryTooltip key={i} term={part}>
              {part}
            </GlossaryTooltip>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function glossaryTextRenderer({ node, ...props }) {
  return <GlossaryText {...props} />;
}

export default GlossaryText;
