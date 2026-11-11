'use client';

/**
 * @file components/DonationCTA.js
 * @description Card de chamada para doações na home do Agentic Space. Exibe o
 * apelo de financiamento (upgrade Vercel Hobby → Pro), o QR Code PIX "copia e
 * cola" (payload EMV/BR Code) e a carteira EVM receptora. Linka para a página
 * de transparência (/transparencia).
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, HeartHandshake, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';
import { generateQrDataUrl } from '@/lib/qr-utils';
import { generatePixPayload, PIX_KEY_DISPLAY } from '@/lib/pix-payload';
import { DONATION_WALLET } from '@/lib/donations';

/** Botão de copiar texto com feedback visual temporário. */
function CopyButton({ text, label, className = '' }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DonationCTA:handleCopy] error clipboard_failed`, error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-700 ${className}`}
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      {copied ? t('donation.copied') : label}
    </button>
  );
}

export default function DonationCTA() {
  const t = useTranslations();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const pixPayload = generatePixPayload();

  useEffect(() => {
    let mounted = true;
    generateQrDataUrl(pixPayload, { width: 320, margin: 1 })
      .then((url) => { if (mounted) setQrDataUrl(url); })
      .catch((error) => {
        console.error(`[${new Date().toISOString()}] [DonationCTA:useEffect] error qr_generation_failed`, error);
      });
    return () => { mounted = false; };
  }, [pixPayload]);

  return (
    <section
      data-testid="donation-cta"
      className="card flex flex-col gap-6 border-brand-500/30 md:flex-row md:items-center"
    >
      <div className="flex-1 space-y-4">
        <p className="eyebrow flex items-center gap-2 text-brand-400">
          <HeartHandshake size={16} />
          {t('donation.eyebrow')}
        </p>
        <h2 className="text-xl font-bold text-white md:text-2xl">
          {t('donation.title')}
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          {t('donation.body')}
        </p>

        <div className="space-y-2 text-sm">
          <p className="text-slate-300">
            <span className="font-semibold text-brand-400">PIX:</span>{' '}
            <span className="font-mono">{PIX_KEY_DISPLAY}</span> — Rapport Tecnologia
          </p>
          <p className="break-all text-slate-300">
            <span className="font-semibold text-brand-400">USDC · USDT · ETH · POL · BRLA:</span>{' '}
            <span className="font-mono text-xs">{DONATION_WALLET}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CopyButton text={pixPayload} label={t('donation.copyPix')} />
          <CopyButton text={DONATION_WALLET} label={t('donation.copyWallet')} />
          <Link href="/transparencia" className="link-arrow text-sm">
            {t('donation.transparencyLink')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="rounded-xl bg-white p-3 shadow-lg">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={t('donation.qrAlt')}
              width={160}
              height={160}
              className="h-40 w-40"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-xs text-slate-500">
              …
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400">{t('donation.qrCaption')}</p>
      </div>
    </section>
  );
}
