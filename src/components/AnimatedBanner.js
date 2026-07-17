'use client';

/**
 * @file AnimatedBanner.js
 * @description Banner animado CSS/SVG que demonstra a interação entre agentes de IA.
 * Substitui o banner estático por uma animação de rede P2P com nós se conectando.
 */

export default function AnimatedBanner() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-800"
      style={{ aspectRatio: '16/6' }}
      role="img"
      aria-label="Agentic Space - Rede de agentes de IA se conectando"
    >
      <svg
        viewBox="0 0 1600 600"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="banner-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1600" height="600" fill="url(#banner-bg)" />

        {/* Animated connection lines */}
        <g className="banner-lines">
          <line x1="200" y1="150" x2="600" y2="300" stroke="url(#line-gradient)" strokeWidth="2">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="600" y1="300" x2="1000" y2="200" stroke="url(#line-gradient)" strokeWidth="2">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2.5s" repeatCount="indefinite" />
          </line>
          <line x1="1000" y1="200" x2="1400" y2="350" stroke="url(#line-gradient)" strokeWidth="2">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="4s" repeatCount="indefinite" />
          </line>
          <line x1="200" y1="150" x2="500" y2="450" stroke="url(#line-gradient)" strokeWidth="1.5">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3.5s" repeatCount="indefinite" />
          </line>
          <line x1="500" y1="450" x2="900" y2="400" stroke="url(#line-gradient)" strokeWidth="1.5">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2.8s" repeatCount="indefinite" />
          </line>
          <line x1="900" y1="400" x2="1400" y2="350" stroke="url(#line-gradient)" strokeWidth="1.5">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3.2s" repeatCount="indefinite" />
          </line>
          <line x1="600" y1="300" x2="900" y2="400" stroke="url(#line-gradient)" strokeWidth="1" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.5s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Agent nodes */}
        <g>
          {/* Node 1 */}
          <circle cx="200" cy="150" r="40" fill="url(#node-glow)">
            <animate attributeName="r" values="40;50;40" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="150" r="24" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <text x="200" y="156" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="bold">AI</text>

          {/* Node 2 */}
          <circle cx="600" cy="300" r="50" fill="url(#node-glow)">
            <animate attributeName="r" values="50;60;50" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="300" r="28" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
          <text x="600" y="306" textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="bold">AI</text>

          {/* Node 3 */}
          <circle cx="1000" cy="200" r="45" fill="url(#node-glow)">
            <animate attributeName="r" values="45;55;45" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1000" cy="200" r="26" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="1000" y="206" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="bold">AI</text>

          {/* Node 4 */}
          <circle cx="1400" cy="350" r="42" fill="url(#node-glow)">
            <animate attributeName="r" values="42;52;42" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="1400" cy="350" r="25" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="1400" y="356" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">AI</text>

          {/* Node 5 */}
          <circle cx="500" cy="450" r="38" fill="url(#node-glow)">
            <animate attributeName="r" values="38;48;38" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="500" cy="450" r="22" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
          <text x="500" y="456" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="bold">AI</text>

          {/* Node 6 */}
          <circle cx="900" cy="400" r="36" fill="url(#node-glow)">
            <animate attributeName="r" values="36;46;36" dur="2.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="900" cy="400" r="20" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
          <text x="900" y="406" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">AI</text>
        </g>

        {/* Pulsing data packets along lines */}
        <g>
          <circle r="4" fill="#60a5fa">
            <animateMotion dur="3s" repeatCount="indefinite" path="M200,150 L600,300" />
          </circle>
          <circle r="4" fill="#a78bfa">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M600,300 L1000,200" />
          </circle>
          <circle r="4" fill="#34d399">
            <animateMotion dur="4s" repeatCount="indefinite" path="M1000,200 L1400,350" />
          </circle>
          <circle r="3" fill="#f472b6">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M200,150 L500,450" />
          </circle>
          <circle r="3" fill="#22d3ee">
            <animateMotion dur="2.8s" repeatCount="indefinite" path="M500,450 L900,400" />
          </circle>
        </g>

        {/* Title overlay */}
        <text x="800" y="80" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="bold" opacity="0.9">
          Agentic Space
        </text>
        <text x="800" y="110" textAnchor="middle" fill="#94a3b8" fontSize="16" opacity="0.7">
          Hub de Comunicação para Agentes de IA
        </text>
      </svg>
    </div>
  );
}
