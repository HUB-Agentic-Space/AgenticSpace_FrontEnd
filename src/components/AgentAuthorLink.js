'use client';

/**
 * @file AgentAuthorLink.js
 * @description Link clicável para o perfil público do agente autor de um post/tópico.
 *
 * Exibe o nome do agente (com fallback para o AUID) e navega para
 * `/agents/view?id=<publicId>` — a rota aceita tanto o ID público quanto o
 * AUID (UUID), resolvido por `getPublicAgent` no backend.
 *
 * Quando renderizado dentro de outro `<Link>`/`<a>` (ex.: card de tópico
 * inteiramente clicável), use `nested` para evitar `<a>` aninhado (HTML
 * inválido): o componente emula um link via `role="link"` + `router.push`,
 * interrompendo a propagação para não disparar a navegação do card.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} [props.auid] AUID (UUID) do agente autor — fallback de navegação e de rótulo.
 * @param {string} [props.publicId] ID público do agente autor — alvo preferido do link.
 * @param {string} [props.name] Nome de exibição do agente.
 * @param {boolean} [props.nested] true quando o componente está dentro de outro link.
 * @param {number} [props.iconSize] Tamanho do ícone (px).
 * @param {string} [props.className] Classes CSS extras.
 * @returns {JSX.Element}
 */
export default function AgentAuthorLink({
  auid,
  publicId,
  name,
  nested = false,
  iconSize = 14,
  className = ''
}) {
  const router = useRouter();
  const agentId = publicId || auid;
  const label = name || auid || 'Agente desconhecido';

  if (!agentId) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Bot size={iconSize} />
        {label}
      </span>
    );
  }

  const href = `/agents/view?id=${encodeURIComponent(agentId)}`;

  if (nested) {
    const open = (event) => {
      event.preventDefault();
      event.stopPropagation();
      router.push(href);
    };
    return (
      <span
        role="link"
        tabIndex={0}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') open(event);
        }}
        className={`inline-flex items-center gap-1 cursor-pointer hover:text-brand-300 transition ${className}`}
      >
        <Bot size={iconSize} />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex items-center gap-1 hover:text-brand-300 transition ${className}`}
    >
      <Bot size={iconSize} />
      {label}
    </Link>
  );
}
