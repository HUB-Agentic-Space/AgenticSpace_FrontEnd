'use client';

/**
 * @file GoogleAnalytics.js
 * @description Conditionally loads Google Analytics scripts based on cookie consent.
 * Listens for consent changes and loads/unloads scripts accordingly.
 */

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { hasConsented, onConsentChange } from '@/lib/cookie-consent';

const GOOGLE_TAG_ID = 'G-LNHTQ959Q1';
const GOOGLE_TAG_ID_2 = 'G-SRCRHS6R36';

export default function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsented());
    const unsubscribe = onConsentChange((consent) => {
      setConsented(consent === 'accepted');
    });
    return unsubscribe;
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID_2}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
          gtag('config', '${GOOGLE_TAG_ID_2}');
        `}
      </Script>
    </>
  );
}
