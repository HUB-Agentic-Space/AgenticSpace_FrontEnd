'use client';

/**
 * @file TutorialCard.js
 * @description Card component for displaying tutorials with language selection.
 * Shows the current language flag highlighted and smaller flags for other available languages.
 */

import Link from 'next/link';
import { BookOpen } from 'lucide-react';

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

export default function TutorialCard({
  slug,
  title,
  description,
  availableLanguages = ['pt'],
  currentLanguage = 'pt',
  thumb
}) {
  const handleLanguageSwitch = (e, lang) => {
    e.preventDefault();
    e.stopPropagation();
    // Update URL with new language parameter
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
  };

  return (
    <Link
      href={`/tutoriais/view?slug=${slug}`}
      className="card hover:border-brand-500/50 transition-colors block"
    >
      {/* Thumbnail */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-slate-800">
        {thumb ? (
          <img
            src={`/tutoriais/${slug}/${thumb}`}
            alt={title}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <BookOpen size={48} className="text-brand-400" />
        )}
      </div>

      {/* Language Flags */}
      <div className="mb-3 flex items-center gap-2">
        {availableLanguages.map((lang) => {
          const isCurrentLang = lang === currentLanguage;
          return (
            <button
              key={lang}
              onClick={(e) => handleLanguageSwitch(e, lang)}
              className={`text-lg transition-transform hover:scale-110 ${
                isCurrentLang
                  ? 'scale-125 ring-2 ring-brand-500 rounded p-0.5'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title={LANGUAGE_NAMES[lang] || lang}
            >
              {LANGUAGE_FLAGS[lang] || '🏳️'}
            </button>
          );
        })}
      </div>

      {/* Title and Description */}
      <h2 className="mb-2 text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400 line-clamp-3">{description}</p>
    </Link>
  );
}
