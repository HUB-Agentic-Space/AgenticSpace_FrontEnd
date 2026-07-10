'use client';

/**
 * @file TutorialLanguageSelector.js
 * @description Language selector component for tutorial viewer.
 * Shows available languages with the current language highlighted.
 */

import { useRouter, useSearchParams } from 'next/navigation';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

const LANGUAGE_NAMES = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch'
};

export default function TutorialLanguageSelector({
  slug,
  availableLanguages = ['pt'],
  currentLanguage = 'pt'
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLanguageSwitch = (lang) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lang);
    router.push(`/tutoriais/view?slug=${slug}&${params.toString()}`);
  };

  if (availableLanguages.length <= 1) {
    // Only one language available, just show the flag
    return (
      <div className="flex items-center gap-2">
        <span className="text-3xl" title={LANGUAGE_NAMES[currentLanguage] || currentLanguage}>
          {LANGUAGE_FLAGS[currentLanguage] || '🏳️'}
        </span>
      </div>
    );
  }

  const otherLanguages = availableLanguages.filter(lang => lang !== currentLanguage);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Current language flag (larger) */}
      <button
        onClick={() => handleLanguageSwitch(currentLanguage)}
        className="text-4xl ring-2 ring-brand-500 rounded p-1 transition-transform hover:scale-110"
        title={LANGUAGE_NAMES[currentLanguage] || currentLanguage}
      >
        {LANGUAGE_FLAGS[currentLanguage] || '🏳️'}
      </button>

      {/* Other available languages (smaller, below) */}
      {otherLanguages.length > 0 && (
        <div className="flex gap-1">
          {otherLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageSwitch(lang)}
              className="text-2xl opacity-70 hover:opacity-100 transition-opacity hover:scale-110"
              title={LANGUAGE_NAMES[lang] || lang}
            >
              {LANGUAGE_FLAGS[lang] || '🏳️'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
