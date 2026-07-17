'use client';

/**
 * @file TokenomicsPreview.js
 * @description Seção compacta na homepage que integra a tokenomia do CAS
 * na proposta de valor geral, explicando benefícios de forma acessível.
 */

import Link from 'next/link';
import { Coins, Shield, Users, Zap, ArrowRight } from 'lucide-react';
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

export default function TokenomicsPreview() {
  const t = useTranslations();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Coins className="text-brand-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('home.tokenomics.title')}
          </h2>
          <p className="text-sm text-slate-400">
            {t('home.tokenomics.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="card">
              <Icon className="mb-3 text-brand-400" size={24} />
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

      <div className="text-center">
        <Link
          href="/info/cas-token"
          className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium"
        >
          {t('home.tokenomics.learnMore')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
