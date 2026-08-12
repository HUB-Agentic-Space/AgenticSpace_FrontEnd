'use client';

/**
 * @file Footer.js
 * @description Rodape padrao exibido em todas as paginas do frontend.
 */

import Link from 'next/link';
import { Building2, Phone, Mail, User, Shield } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="text-brand-400" size={24} />
              <h3 className="text-lg font-bold text-white">
                {t('footer.companyName')}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">{t('footer.cnpjLabel')}:</span>{' '}
                67.904.299/0001-80
              </p>
              <p>
                <span className="text-slate-400">{t('footer.ceoCto')}:</span>{' '}
                Carlos Delfino
              </p>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="text-brand-400" size={24} />
              <h3 className="text-lg font-bold text-white">
                {t('footer.contact')}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p>{t('footer.whatsappPrincipal')}</p>
              <a
                href="https://wa.me/5585985205490"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-brand-400 hover:text-brand-300 hover:underline"
              >
                85 98520-5490
              </a>
            </div>
          </div>

          {/* Email e links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="text-brand-400" size={24} />
              <h3 className="text-lg font-bold text-white">
                {t('footer.emailLabel')}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <a
                href="mailto:consultoria@carlosdelfino.eti.br"
                className="block text-brand-400 hover:text-brand-300 hover:underline"
              >
                consultoria@carlosdelfino.eti.br
              </a>
            </div>
            <div className="pt-2">
              <Link
                href="/security-policy"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-300"
              >
                <Shield size={16} />
                {t('footer.securityPolicy')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
