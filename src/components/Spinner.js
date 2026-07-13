'use client';

/**
 * @file Spinner.js
 * @description Spinner circular leve extraido do logo do Agentic Space.
 *
 * Usa um SVG inline com as cores da marca (#28BEFD, #0146DF, #BEF5FC, #E6C8FD)
 * e animacao CSS pura, sem dependencias externas. Substitui o Loader2 do
 * lucide-react em toda a aplicacao para reduzir o peso de carga.
 *
 * @param {{ size?: number, className?: string }} props
 */
export default function Spinner({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`agentic-spinner ${className}`}
      role="status"
      aria-label="Carregando"
    >
      <defs>
        <linearGradient id="agentic-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#28BEFD" />
          <stop offset="50%" stopColor="#0146DF" />
          <stop offset="100%" stopColor="#E6C8FD" />
        </linearGradient>
      </defs>
      {/* Círculo de fundo (track) */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#1e293b"
        strokeWidth="8"
        opacity="0.3"
      />
      {/* Círculo animado com gradiente da marca */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#agentic-spinner-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="180 264"
        className="agentic-spinner-circle"
      />
      {/* Ponto central luminoso */}
      <circle cx="50" cy="50" r="4" fill="#BEF5FC" className="agentic-spinner-dot" />
    </svg>
  );
}
