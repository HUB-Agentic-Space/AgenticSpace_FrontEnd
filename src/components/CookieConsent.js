'use client';

/**
 * @file CookieConsent.js
 * @description Cookie consent modal for language preference.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith('cookie_consent='));
    
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    document.cookie = 'cookie_consent=accepted; path=/; max-age=31536000';
    setShow(false);
  };

  const handleReject = () => {
    document.cookie = 'cookie_consent=rejected; path=/; max-age=31536000';
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="card border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <button
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition"
        >
          <X size={16} />
        </button>
        <h3 className="font-semibold text-white mb-2">Este site usa cookies</h3>
        <p className="text-sm text-slate-400 mb-4">
          Usamos cookies para salvar sua preferência de idioma e melhorar sua experiência.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
          >
            Aceitar
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
