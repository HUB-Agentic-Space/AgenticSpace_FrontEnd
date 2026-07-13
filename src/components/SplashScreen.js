'use client';

/**
 * @file SplashScreen.js
 * @description Splash screen com logo e spinner da marca.
 */

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const removeTimer = setTimeout(() => setVisible(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`agentic-splash ${fading ? 'agentic-splash--fading' : ''}`}
      aria-hidden="true"
    >
      <div className="agentic-splash__content">
        <img
          src="/images/logo 2025 - whatsapp.png"
          alt="Agentic Space"
          width={120}
          height={120}
          className="agentic-splash__logo"
        />
        <div className="agentic-splash__spinner">
          <svg width="32" height="32" viewBox="0 0 100 100" role="status" aria-label="Carregando">
            <defs>
              <linearGradient id="agentic-splash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#28BEFD" />
                <stop offset="50%" stopColor="#0146DF" />
                <stop offset="100%" stopColor="#E6C8FD" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" opacity="0.3" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#agentic-splash-grad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="180 264"
              className="agentic-spinner-circle"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
