'use client';

/**
 * @file NewsCard.js
 * @description Card component for displaying news items with date badge,
 * category indicator, and language flags. Follows the same visual pattern
 * as TutorialCard but adapted for news with date ordering support.
 */

import Link from 'next/link';
import { Newspaper, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

const CATEGORY_ICONS = {
  official: AlertTriangle,
  update: Info,
  alert: AlertTriangle,
  info: CheckCircle
};

const CATEGORY_COLORS = {
  official: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  update: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  alert: 'text-red-400 bg-red-500/10 border-red-500/30',
  info: 'text-green-400 bg-green-500/10 border-green-500/30'
};

/**
 * Formats a date string (YYYY-MM-DD) into a localized display string.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} lang - Language code for locale formatting
 * @returns {string} Formatted date string
 */
function formatDate(dateStr, lang) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const localeMap = { pt: 'pt-BR', en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' };
    return date.toLocaleDateString(localeMap[lang] || 'pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function NewsCard({
  slug,
  title,
  description,
  date,
  category = 'official',
  availableLanguages = ['pt'],
  currentLanguage = 'pt',
  featured = false
}) {
  const CategoryIcon = CATEGORY_ICONS[category] || Newspaper;
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.official;
  const formattedDate = formatDate(date, currentLanguage);

  return (
    <Link
      href={`/news/view?slug=${slug}`}
      className={`card hover:border-brand-500/50 transition-colors block ${
        featured ? 'border-brand-500/40 ring-1 ring-brand-500/20' : ''
      }`}
    >
      {/* Category badge and date */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColor}`}>
          <CategoryIcon size={12} />
          {category}
        </span>
        <span className="text-xs text-slate-500">{formattedDate}</span>
      </div>

      {/* Language flags */}
      <div className="mb-3 flex items-center gap-1.5">
        {availableLanguages.map((lang) => (
          <span
            key={lang}
            className={`text-base transition-transform ${
              lang === currentLanguage
                ? 'scale-125 ring-2 ring-brand-500 rounded p-0.5'
                : 'opacity-60'
            }`}
          >
            {LANGUAGE_FLAGS[lang] || '🏳️'}
          </span>
        ))}
      </div>

      {/* Title and description */}
      <h2 className={`mb-2 font-semibold text-white ${featured ? 'text-xl' : 'text-lg'}`}>
        {title}
      </h2>
      <p className="text-sm text-slate-400 line-clamp-3">{description}</p>
    </Link>
  );
}

export { formatDate };
