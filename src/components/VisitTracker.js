'use client';

/**
 * @file VisitTracker.js
 * @description Componente que rastreia visitas ao site com geolocalização.
 * Captura país e região do visitante e envia para o backend.
 */

import { useEffect, useState } from 'react';
import { hasConsented, onConsentChange } from '@/lib/cookie-consent';

export default function VisitTracker() {
  const [hasTracked, setHasTracked] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsented());
    const unsubscribe = onConsentChange((consent) => {
      setConsented(consent === 'accepted');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasTracked || !consented) return;

    const trackVisit = async () => {
      try {
        // Gerar ou recuperar session ID
        let sessionId = sessionStorage.getItem('visit_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('visit_session_id', sessionId);
        }

        // Obter geolocalização
        let country = null;
        let region = null;

        try {
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            country = data.country_name || data.country || null;
            region = data.region || null;
          }
        } catch (geoError) {
          console.warn('[VisitTracker] Falha ao obter geolocalização:', geoError);
        }

        // Enviar dados para o backend
        await fetch('/api/v1/track/visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            path: window.location.pathname,
            country,
            region
          })
        });

        setHasTracked(true);
        console.log(
          `[${new Date().toISOString()}] [VisitTracker] info visita_registrada - session_id=${sessionId} country=${country} region=${region}`
        );
      } catch (error) {
        console.error('[VisitTracker] Erro ao rastrear visita:', error);
      }
    };

    // Rastrear apenas uma vez por sessão
    trackVisit();
  }, [hasTracked, consented]);

  return null;
}
