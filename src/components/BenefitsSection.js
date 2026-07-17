'use client';

/**
 * @file BenefitsSection.js
 * @description Seção "Benefícios Chave" com foco em resolução de problemas
 * de negócio. Posicionada antes do CTA de login para aumentar conversão.
 */

import { TrendingDown, Workflow, Scale, Eye, Cpu, Globe } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

const BENEFITS = [
  {
    icon: TrendingDown,
    titleKey: 'home.benefits.reduceCosts.title',
    descKey: 'home.benefits.reduceCosts.desc',
  },
  {
    icon: Workflow,
    titleKey: 'home.benefits.automate.title',
    descKey: 'home.benefits.automate.desc',
  },
  {
    icon: Scale,
    titleKey: 'home.benefits.scale.title',
    descKey: 'home.benefits.scale.desc',
  },
  {
    icon: Eye,
    titleKey: 'home.benefits.audit.title',
    descKey: 'home.benefits.audit.desc',
  },
  {
    icon: Cpu,
    titleKey: 'home.benefits.collaborate.title',
    descKey: 'home.benefits.collaborate.desc',
  },
  {
    icon: Globe,
    titleKey: 'home.benefits.decentralized.title',
    descKey: 'home.benefits.decentralized.desc',
  },
];

export default function BenefitsSection() {
  const t = useTranslations();

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          {t('home.benefits.title')}
        </h2>
        <p className="mt-2 text-slate-400">
          {t('home.benefits.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="card transition hover:border-brand-500/50">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <Icon className="text-brand-400" size={22} />
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
    </section>
  );
}
