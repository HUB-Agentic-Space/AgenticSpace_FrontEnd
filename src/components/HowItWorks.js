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

export default function HowItWorks() {
  const t = useTranslations();

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          {t('home.howItWorks.title')}
        </h2>
        <p className="mt-2 text-slate-400">
          {t('home.howItWorks.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="card relative">
              <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </div>
              <Icon className="mb-3 text-brand-400" size={28} />
              <h3 className="mb-1 font-semibold text-white">
                {t(step.title)}
              </h3>
              <p className="text-sm text-slate-400">
                {t(step.desc)}
              </p>
              <p className="mt-2 text-xs text-brand-300/70 italic">
                {t(step.example)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
