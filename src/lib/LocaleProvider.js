'use client';

/**
 * @file LocaleProvider.js
 * @description Provider for managing locale and translations.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { defaultLocale, locales } from '@/i18n/config';
import ptTranslations from '@/i18n/locales/pt.json';

const LocaleContext = createContext({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key
});

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(defaultLocale);
  const [translations, setTranslations] = useState(ptTranslations);

  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && locales.includes(urlLang)) {
      loadLocale(urlLang);
      return;
    }

    // Check cookie
    const cookieLang = document.cookie
      .split('; ')
      .find(row => row.startsWith('preferred_lang='))
      ?.split('=')[1];
    if (cookieLang && locales.includes(cookieLang)) {
      loadLocale(cookieLang);
      return;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (locales.includes(browserLang)) {
      loadLocale(browserLang);
      return;
    }

    // Default
    loadLocale(defaultLocale);
  }, []);

  const loadLocale = async (newLocale) => {
    try {
      const localeTranslations = await import(`@/i18n/locales/${newLocale}.json`);
      setTranslations(localeTranslations.default);
      setLocale(newLocale);
    } catch (error) {
      console.error(`Failed to load locale ${newLocale}:`, error);
      // Fallback to default
      const defaultTranslations = await import(`@/i18n/locales/${defaultLocale}.json`);
      setTranslations(defaultTranslations.default);
      setLocale(defaultLocale);
    }
  };

  const changeLocale = (newLocale) => {
    if (locales.includes(newLocale)) {
      document.cookie = `preferred_lang=${newLocale}; path=/; max-age=31536000`;
      loadLocale(newLocale);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return context;
}

export function useTranslations() {
  const { t } = useLocaleContext();
  return t;
}
