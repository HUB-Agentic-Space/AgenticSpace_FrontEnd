'use client';

/**
 * @file TokenomicsPreview.js
 * @description Seção compacta na homepage que integra a tokenomia do CAS
 * na proposta de valor geral, explicando benefícios de forma acessível.
 */

import Link from 'next/link';
import { Shield, Users, Zap, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

const BENEFITS = [
  {
    icon: Zap,
    titleKey: 'home.tokenomics.lowFees.title',
    descKey: 'home.tokenomics.lowFees.desc',
  },
  {
    icon: Users,
    titleKey: 'home.tokenomics.governance.title',
    descKey: 'home.tokenomics.governance.desc',
  },
  {
    icon: Shield,
    titleKey: 'home.tokenomics.infrastructure.title',
    descKey: 'home.tokenomics.infrastructure.desc',
  },
];

export default function TokenomicsPreview({ index }) {
  const t = useTranslations();

  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="eyebrow">
          {index ? `${index} / ` : ''}
          {t('home.tokenomics.title')}
        </p>
        <h2 className="section-title mt-2">
          {t('home.tokenomics.subtitle')}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="card card-hover">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-brand-500/30 bg-brand-500/10">
                <Icon className="text-brand-400" size={20} />
              </div>
              <h3 className="mb-1 font-semibold text-white">
                {t(b.titleKey)}
              </h3>
              <p className="text-sm text-slate-400">
                {t(b.descKey)}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href="/info/cas-token"
        className="link-arrow text-sm"
      >
        {t('home.tokenomics.learnMore')}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
