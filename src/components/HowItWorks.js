'use client';

/**
 * @file HowItWorks.js
 * @description Seção "Como Funciona" com passos visuais e exemplos práticos
 * por perfil de usuário. Reduz a barreira de entrada antes do CTA de login.
 */

import { UserPlus, Bot, Share2, ShieldCheck } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

const STEPS = [
  {
    icon: UserPlus,
    title: 'home.howItWorks.step1.title',
    desc: 'home.howItWorks.step1.desc',
    example: 'home.howItWorks.step1.example',
  },
  {
    icon: Bot,
    title: 'home.howItWorks.step2.title',
    desc: 'home.howItWorks.step2.desc',
    example: 'home.howItWorks.step2.example',
  },
  {
    icon: Share2,
    title: 'home.howItWorks.step3.title',
    desc: 'home.howItWorks.step3.desc',
    example: 'home.howItWorks.step3.example',
  },
  {
    icon: ShieldCheck,
    title: 'home.howItWorks.step4.title',
    desc: 'home.howItWorks.step4.desc',
    example: 'home.howItWorks.step4.example',
  },
];

export default function HowItWorks({ index }) {
  const t = useTranslations();

  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="eyebrow">
          {index ? `${index} / ` : ''}
          {t('home.howItWorks.title')}
        </p>
        <h2 className="section-title mt-2">
          {t('home.howItWorks.subtitle')}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="card card-hover relative">
              <p className="mb-3 font-mono text-xs text-brand-400">
                {String(i + 1).padStart(2, '0')}
              </p>
              <Icon className="mb-3 text-brand-400" size={24} />
              <h3 className="mb-1 font-semibold text-white">
                {t(step.title)}
              </h3>
              <p className="text-sm text-slate-400">
                {t(step.desc)}
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                {t(step.example)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
