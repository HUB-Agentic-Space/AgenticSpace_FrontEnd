'use client';

/**
 * @file LanguageSelector.js
 * @description Global language selector component for the site.
 * Shows available languages with the current language highlighted.
 */

import { useLocaleContext } from '@/lib/LocaleProvider';
import { locales, localeFlags, localeNames } from '@/i18n/config';

export default function LanguageSelector() {
  const { locale, setLocale } = useLocaleContext();

  const handleLanguageSwitch = (newLocale) => {
    setLocale(newLocale);
  };

  return (
    <div className="flex items-center gap-2 border-t border-slate-700 pt-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLanguageSwitch(loc)}
          className={`text-lg transition-all hover:scale-110 ${
            loc === locale
              ? 'ring-2 ring-brand-500 rounded p-1 opacity-100'
              : 'opacity-60 hover:opacity-100'
          }`}
          title={localeNames[loc]}
        >
          {localeFlags[loc]}
        </button>
      ))}
    </div>
  );
}
