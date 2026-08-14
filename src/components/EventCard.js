'use client';

/**
 * @file EventCard.js
 * @description Card component for displaying scheduled events.
 * Follows the same visual pattern as NewsCard and TutorialCard.
 */

import Link from 'next/link';
import { Calendar, Clock, Globe } from 'lucide-react';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

const STATUS_COLORS = {
  recorrente: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
  unico: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  encerrado: 'text-slate-400 bg-slate-700/30 border-slate-600/30',
};

const STATUS_LABELS = {
  recorrente: 'Recorrente',
  unico: 'Único',
  encerrado: 'Encerrado',
};

/**
 * Formats a date string (YYYY-MM-DD) into a localized display string.
 * @param {string} dateStr
 * @param {string} lang
 * @returns {string}
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

export default function EventCard({
  slug,
  title,
  description,
  date,
  time,
  timezone,
  category = 'encontro',
  status = 'recorrente',
  availableLanguages = ['pt'],
  currentLanguage = 'pt',
}) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.recorrente;
  const statusLabel = STATUS_LABELS[status] || status;
  const formattedDate = date ? formatDate(date, currentLanguage) : null;

  return (
    <Link
      href={`/eventos/view?slug=${slug}`}
      className="card hover:border-brand-500/50 transition-colors block"
    >
      {/* Category and status */}
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-brand-400 border-brand-500/30 bg-brand-500/10">
          <Calendar size={12} />
          {category}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor}`}>
          <Clock size={12} />
          {statusLabel}
        </span>
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
      <h2 className="mb-2 text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400 line-clamp-3 mb-3">{description}</p>

      {/* Date, time and timezone */}
      {(formattedDate || time || timezone) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formattedDate}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {time}
            </span>
          )}
          {timezone && (
            <span className="flex items-center gap-1">
              <Globe size={12} />
              {timezone}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
