'use client';

/**
 * @file useLocale.js
 * @description Hook to manage locale detection and persistence.
 */

import { useState, useEffect } from 'react';
import { defaultLocale, locales } from '@/i18n/config';

export function useLocale() {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && locales.includes(urlLang)) {
      setLocale(urlLang);
      return;
    }

    // Check cookie
    const cookieLang = document.cookie
      .split('; ')
      .find(row => row.startsWith('preferred_lang='))
      ?.split('=')[1];
    if (cookieLang && locales.includes(cookieLang)) {
      setLocale(cookieLang);
      return;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (locales.includes(browserLang)) {
      setLocale(browserLang);
      return;
    }

    // Default
    setLocale(defaultLocale);
  }, []);

  const changeLocale = (newLocale) => {
    if (locales.includes(newLocale)) {
      document.cookie = `preferred_lang=${newLocale}; path=/; max-age=31536000`;
      setLocale(newLocale);
    }
  };

  return { locale, changeLocale };
}
