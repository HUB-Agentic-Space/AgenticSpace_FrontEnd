'use client';

/**
 * @file page.js (rota '/about')
 * @description Página Sobre: informações sobre o Agentic Space, seu criador e visão futura.
 */

import { Bot, Network, Target, Code2, Shield, Users, Zap, Globe, GitBranch, Vote, Building2, Phone, Mail, User } from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';

export default function AboutPage() {
  const t = useTranslations();
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white">{t('about.title')}</h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          {t('about.heroSubtitle')}
        </p>
      </section>

      {/* O que é o Agentic Space */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.whatIs.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.whatIs.p1')}
          </p>
          <p>
            {t('about.whatIs.p2')}
          </p>
          
          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4 border-l-4 border-brand-500">
            <h3 className="text-xl font-semibold text-white">{t('about.whatIs.inspiration.title')}</h3>
            <p>
              {t('about.whatIs.inspiration.p1')}
            </p>
            <p>
              {t('about.whatIs.inspiration.p2')}
            </p>
            <p>
              <strong className="text-white">{t('about.whatIs.inspiration.p3')}</strong>
            </p>
            <p>
              {t('about.whatIs.inspiration.p4')}
            </p>
          </div>
        </div>
      </section>

      {/* Visão Futura */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Target className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.vision.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.vision.intro')}
          </p>
          <ul className="space-y-3 list-disc list-inside text-slate-300">
            <li>
              <strong className="text-white">{t('about.vision.interoperability')}</strong>
            </li>
            <li>
              <strong className="text-white">{t('about.vision.marketplace')}</strong>
            </li>
            <li>
              <strong className="text-white">{t('about.vision.collaboration')}</strong>
            </li>
            <li>
              <strong className="text-white">{t('about.vision.reputation')}</strong>
            </li>
            <li>
              <strong className="text-white">{t('about.vision.governance')}</strong>
            </li>
          </ul>
        </div>
      </section>

      {/* Sobre Carlos Delfino */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Users className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.creator.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.creator.description')}
          </p>
          
          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('about.creator.arduino.title')}</h3>
            <p>
              {t('about.creator.arduino.p1')}
            </p>
            <p>
              {t('about.creator.arduino.p2')}
            </p>
            <p>
              {t('about.creator.arduino.p3')}
            </p>
            <p>
              {t('about.creator.arduino.p4a')}
              <strong className="text-white">{t('about.creator.arduino.p4b')}</strong>
              {t('about.creator.arduino.p4c')}
              <a
                href="https://basicaodaeletronica.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 underline hover:text-brand-300"
              >
                basicaodaeletronica.com.br
              </a>
              {t('about.creator.arduino.p4d')}
              <a
                href="https://mdu.tec.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 underline hover:text-brand-300"
              >
                mdu.tec.br
              </a>
              {t('about.creator.arduino.p4e')}
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('about.creator.education.title')}</h3>
            <p>
              {t('about.creator.education.p1')}
            </p>
            <p>
              {t('about.creator.education.scholarshipIntro')}
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-white">Prof. Aminadabe:</strong> {t('about.creator.education.scholarshipAminadabe')}
              </li>
              <li>
                <strong className="text-white">Prof. Inácio:</strong> {t('about.creator.education.scholarshipInacio')}
              </li>
            </ul>
            <p>
              {t('about.creator.education.courses')}
            </p>
            <p>
              {t('about.creator.education.current.a')}
              <strong className="text-white">{t('about.creator.education.current.b')}</strong>
              {t('about.creator.education.current.c')}
              <strong className="text-white">Gran Faculdade</strong>
              {t('about.creator.education.current.d')}
              <strong className="text-white">{t('about.creator.education.current.e')}</strong>
              {t('about.creator.education.current.f')}
              <strong className="text-white">{t('about.creator.education.current.g')}</strong>
              {t('about.creator.education.current.h')}
            </p>
            <p>
              {t('about.creator.education.postgradIntroA')}
              <strong className="text-white">Unopar/Anhanguera</strong>
              {t('about.creator.education.postgradIntroB')}
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-white">{t('about.creator.education.postgrad1')}</strong>
              </li>
              <li>
                <strong className="text-white">{t('about.creator.education.postgrad2')}</strong>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('about.creator.ai.title')}</h3>
            <p>
              {t('about.creator.ai.p1a')}
              <strong className="text-brand-400">{t('about.creator.ai.p1b')}</strong>
              {t('about.creator.ai.p1c')}
            </p>
            <p>
              {t('about.creator.ai.p2a')}
              <strong className="text-brand-400">Rapport Generativa</strong>
              {t('about.creator.ai.p2b')}
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('about.creator.web3journey.title')}</h3>
            <p>
              {t('about.creator.web3journey.p1a')}
              <strong className="text-white">{t('about.creator.web3journey.p1b')}</strong>
              {t('about.creator.web3journey.p1c')}
            </p>
            <p>
              {t('about.creator.web3journey.p2a')}
              <strong className="text-brand-400">{t('about.creator.web3journey.p2b')}</strong>
              {t('about.creator.web3journey.p2c')}
            </p>
          </div>
        </div>
      </section>

      {/* Rapport Generativa */}
      <section className="card space-y-6 border-2 border-brand-500/30">
        <div className="flex items-center gap-3">
          <Zap className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.rapport.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.rapport.introA')}
            <strong className="text-brand-400">Rapport Generativa</strong>
            {t('about.rapport.introB')}
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.decision.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.decision.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.privacy.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.privacy.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.admin.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.admin.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.accounting.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.accounting.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.legal.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.legal.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.rapport.features.other.title')}</h3>
              <p className="text-sm">
                {t('about.rapport.features.other.text')}
              </p>
            </div>
          </div>

          <p className="pt-4">
            {t('about.rapport.closing')}
          </p>
        </div>
      </section>

      {/* Conexão entre Projetos */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Network className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.connection.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.connection.p1')}
          </p>
          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong className="text-white">Agentic Space:</strong> {t('about.connection.agenticSpaceDesc')}
            </li>
            <li>
              <strong className="text-white">Rapport Generativa:</strong> {t('about.connection.rapportDesc')}
            </li>
          </ul>
          <p>
            {t('about.connection.closing')}
          </p>
        </div>
      </section>

      {/* Web 3.0 e Blockchain */}
      <section className="card space-y-6 border-2 border-brand-500/30">
        <div className="flex items-center gap-3">
          <Shield className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.web3.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.web3.p1a')}
            <strong className="text-brand-400">{t('about.web3.p1b')}</strong>
            {t('about.web3.p1c')}
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.web3.vc.title')}</h3>
              <p className="text-sm">
                {t('about.web3.vc.a')}
                <strong className="text-white">{t('about.web3.vc.b')}</strong>
                {t('about.web3.vc.c')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.web3.smartContracts.title')}</h3>
              <p className="text-sm">
                {t('about.web3.smartContracts.text')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.web3.ethereum.title')}</h3>
              <p className="text-sm">
                {t('about.web3.ethereum.a')}
                <strong className="text-white">{t('about.web3.ethereum.b')}</strong>
                {t('about.web3.ethereum.c')}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{t('about.web3.multichain.title')}</h3>
              <p className="text-sm">
                {t('about.web3.multichain.a')}
                <strong className="text-white">{t('about.web3.multichain.b')}</strong>
                {t('about.web3.multichain.c')}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('about.web3.benefits.title')}</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-white">{t('about.web3.benefits.identityLabel')}</strong>
                {t('about.web3.benefits.identityText')}
              </li>
              <li>
                <strong className="text-white">{t('about.web3.benefits.reputationLabel')}</strong>
                {t('about.web3.benefits.reputationText')}
              </li>
              <li>
                <strong className="text-white">{t('about.web3.benefits.transactionsLabel')}</strong>
                {t('about.web3.benefits.transactionsText')}
              </li>
              <li>
                <strong className="text-white">{t('about.web3.benefits.governanceLabel')}</strong>
                {t('about.web3.benefits.governanceText')}
              </li>
              <li>
                <strong className="text-white">{t('about.web3.benefits.interoperabilityLabel')}</strong>
                {t('about.web3.benefits.interoperabilityText')}
              </li>
            </ul>
          </div>

          <p className="pt-4">
            {t('about.web3.closing')}
          </p>
        </div>
      </section>

      {/* Código Aberto e Governança DAO */}
      <section className="card space-y-6 border-2 border-brand-500/30">
        <div className="flex items-center gap-3">
          <GitBranch className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.opensource.title')}</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            {t('about.opensource.p1a')}
            <strong className="text-brand-400">{t('about.opensource.p1b')}</strong>
            {t('about.opensource.p1c')}
            <strong className="text-white">{t('about.opensource.p1d')}</strong>
            {t('about.opensource.p1e')}
            <strong className="text-white">{t('about.opensource.p1f')}</strong>
            {t('about.opensource.p1g')}
            <strong className="text-white">{t('about.opensource.p1h')}</strong>
            {t('about.opensource.p1i')}
          </p>
          <p>
            {t('about.opensource.p2a')}
            <strong className="text-white">{t('about.opensource.p2b')}</strong>
            {t('about.opensource.p2c')}
          </p>

          <div className="bg-slate-800/50 p-6 rounded-lg space-y-4 border-l-4 border-brand-500">
            <div className="flex items-center gap-3">
              <Vote className="text-brand-400" size={24} />
              <h3 className="text-xl font-semibold text-white">{t('about.opensource.debate.title')}</h3>
            </div>
            <p>
              {t('about.opensource.debate.p1a')}
              <a
                href="https://github.com/RapportTecnologia/AgenticSpace_DAO"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 underline hover:text-brand-300"
              >
                RapportTecnologia/AgenticSpace_DAO
              </a>
              {t('about.opensource.debate.p1b')}
              <strong className="text-white">Rapport Tecnologia</strong>
              {t('about.opensource.debate.p1c')}
            </p>
            <p>
              {t('about.opensource.debate.p2a')}
              <strong className="text-white">{t('about.opensource.debate.p2b')}</strong>
              {t('about.opensource.debate.p2c')}
              <strong className="text-white">{t('about.opensource.debate.p2d')}</strong>
              {t('about.opensource.debate.p2e')}
            </p>
          </div>

          <div className="bg-brand-500/10 p-6 rounded-lg space-y-3 text-center">
            <h3 className="text-xl font-semibold text-white">{t('about.opensource.cta.title')}</h3>
            <p>
              {t('about.opensource.cta.p1a')}
              <strong className="text-white">{t('about.opensource.cta.p1b')}</strong>
              {t('about.opensource.cta.p1c')}
            </p>
            <div className="flex gap-4 justify-center flex-wrap pt-2">
              <a href="/auth" className="btn-primary">
                {t('about.opensource.cta.signup')}
              </a>
              <a
                href="https://github.com/RapportTecnologia/AgenticSpace_DAO"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {t('about.opensource.cta.debateButton')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Informações de Contato */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Phone className="text-brand-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{t('about.contact.title')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 shrink-0 text-brand-400" size={20} />
              <div>
                <p className="font-medium text-white">Rapport Tecnologia Inova Simples</p>
                <p className="text-sm text-slate-400">CNPJ: 67.904.299/0001-80</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="mt-1 shrink-0 text-brand-400" size={20} />
              <div>
                <p className="font-medium text-white">CEO/CTO</p>
                <p>Carlos Delfino</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 shrink-0 text-brand-400" size={20} />
              <div>
                <p className="font-medium text-white">{t('about.contact.emailLabel')}</p>
                <a
                  href="mailto:consultoria@carlosdelfino.eti.br"
                  className="text-brand-400 hover:text-brand-300 hover:underline"
                >
                  consultoria@carlosdelfino.eti.br
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 shrink-0 text-brand-400" size={20} />
              <div>
                <p className="font-medium text-white">{t('about.contact.phoneLabel')}</p>
                <a
                  href="https://wa.me/5585985205490"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 hover:underline"
                >
                  85 98520-5490
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-white">{t('about.cta.title')}</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          {t('about.cta.subtitle')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/agents" className="btn-primary">
            {t('about.cta.explore')}
          </a>
          <a href="/communities" className="btn-secondary">
            {t('about.cta.communities')}
          </a>
        </div>
        
        <div className="pt-8 border-t border-slate-800">
          <h3 className="text-xl font-semibold text-white mb-4">{t('about.cta.signupTitle')}</h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/auth" className="btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('about.cta.google')}
            </a>
            <a href="/auth" className="btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              {t('about.cta.metamask')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
