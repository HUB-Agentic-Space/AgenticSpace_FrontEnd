'use client';

/**
 * @file DesafioCard.js
 * @description Card component for displaying challenges with language selection,
 * status badge, and on-chain price/cashback info.
 */

import Link from 'next/link';
import { Trophy, Coins, Gift, Clock } from 'lucide-react';

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

export default function DesafioCard({
  slug,
  title,
  description,
  availableLanguages = ['pt'],
  currentLanguage = 'pt',
  headerImage,
  status = 'liberado',
  phaseData = null,
  cashbackRate = 0,
  requiredCertificateIds = [],
}) {
  const isPlanejamento = status === 'planejamento';
  const price = phaseData?.minCasDeposit;
  const cashback = price && cashbackRate > 0 ? price * cashbackRate : null;

  const handleLanguageSwitch = (e, lang) => {
    e.preventDefault();
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
  };

  return (
    <Link
      href={`/desafios/view?slug=${slug}`}
      className="card hover:border-brand-500/50 transition-colors block"
    >
      {/* Header Image / Thumbnail */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-slate-800 overflow-hidden">
        {headerImage ? (
          <img
            src={`/desafios/${slug}/${headerImage}`}
            alt={title}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <Trophy size={48} className="text-brand-400" />
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-3 flex items-center gap-2">
        {isPlanejamento ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
            <Clock size={12} />
            Em breve
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/30 px-2.5 py-0.5 text-xs font-medium text-brand-400">
            <Trophy size={12} />
            Liberado
          </span>
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

      {/* Required certificates */}
      {requiredCertificateIds.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5 text-sm border-t border-slate-800 pt-3">
          <Lock size={16} className="text-brand-400" />
          <span className="text-slate-400">
            Requer certificado{requiredCertificateIds.length > 1 ? 's' : ''}:{' '}
            {requiredCertificateIds.map((id) => `#${id}`).join(', ')}
          </span>
        </div>
      )}

      {/* Price and Cashback */}
      {price != null && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Coins size={16} className="text-brand-400" />
            <span className="text-slate-300">
              {price.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} CAS
            </span>
          </div>
          {cashback != null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Gift size={16} className="text-brand-300" />
              <span className="text-slate-300">
                Cashback: {cashback.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} CAS
                {cashbackRate > 1 && (
                  <span className="ml-1 text-brand-300 font-medium">(+{Math.round((cashbackRate - 1) * 100)}%)</span>
                )}
                {cashbackRate < 1 && (
                  <span className="ml-1 text-slate-400">({Math.round(cashbackRate * 100)}%)</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
