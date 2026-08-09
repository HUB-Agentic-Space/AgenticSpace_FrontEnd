'use client';

/**
 * @file page.js (rota '/desafios')
 * @description Página de listagem de desafios disponíveis no Agentic Space.
 * Lê os arquivos JSON da pasta public/desafios e exibe os desafios disponíveis
 * com suporte a múltiplos idiomas, dados on-chain e cashback.
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, AlertCircle } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useTranslations } from '@/lib/LocaleProvider';
import DesafioCard from '@/components/DesafioCard';
import matter from 'gray-matter';
import { ethers } from 'ethers';
import {
  fetchPhase,
  getCertificateContract,
  loadCertificateConfig,
  formatCasAmount,
} from '@/lib/certificates';

const LANGUAGE_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
};

function getPreferredLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'es', 'fr', 'de'].includes(urlLang)) {
    return urlLang;
  }

  const cookieLang = document.cookie
    .split('; ')
    .find(row => row.startsWith('preferred_lang='))
    ?.split('=')[1];
  if (cookieLang && ['pt', 'en', 'es', 'fr', 'de'].includes(cookieLang)) {
    return cookieLang;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['pt', 'en', 'es', 'fr', 'de'].includes(browserLang)) {
    return browserLang;
  }

  return 'pt';
}

async function loadDesafioMetadata(slug, lang) {
  try {
    const response = await fetch(`/desafios/${slug}/desafio-${lang}.md`);
    if (!response.ok) {
      return null;
    }
    const content = await response.text();
    const { data } = matter(content);
    return data;
  } catch (err) {
    console.error(`[DesafiosPage] Error loading desafio metadata for ${slug} in ${lang}:`, err);
    return null;
  }
}

async function loadPhaseData(config, phaseId) {
  if (!config?.certificateAddress || !ethers.isAddress(config.certificateAddress)) {
    return null;
  }
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
    const contract = getCertificateContract(config.certificateAddress, provider);
    const phase = await fetchPhase(contract, provider, BigInt(phaseId));
    return {
      minCasDeposit: Number(ethers.formatUnits(phase.minCasDeposit || 0n, 18)),
      active: phase.active === 1 || phase.active === true,
      skillsDescription: phase.skillsDescription || '',
      instructions: phase.instructions || '',
      name: phase.name || '',
    };
  } catch (err) {
    console.warn(`[DesafiosPage] Failed to load phase ${phaseId}:`, err?.message || err);
    return null;
  }
}

function DesafiosPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('pt');

  useEffect(() => {
    loadDesafios();
  }, []);

  useEffect(() => {
    const lang = getPreferredLanguage();
    setCurrentLanguage(lang);
  }, [searchParams]);

  async function loadDesafios() {
    try {
      setLoading(true);
      const response = await fetch('/desafios/index.json');
      if (!response.ok) {
        throw new Error('Falha ao carregar lista de desafios');
      }
      const data = await response.json();
      const challengesList = data.challenges || [];

      const config = await loadCertificateConfig();

      const lang = getPreferredLanguage();
      const challengesWithMetadata = await Promise.all(
        challengesList.map(async (challenge) => {
          let metadata = await loadDesafioMetadata(challenge.slug, lang);

          if (!metadata && challenge.defaultLanguage) {
            metadata = await loadDesafioMetadata(challenge.slug, challenge.defaultLanguage);
          }

          if (!metadata && challenge.availableLanguages && challenge.availableLanguages.length > 0) {
            metadata = await loadDesafioMetadata(challenge.slug, challenge.availableLanguages[0]);
          }

          const phaseId = metadata?.certificatePhaseId || challenge.certificatePhaseId;
          const phaseData = phaseId ? await loadPhaseData(config, phaseId) : null;

          return {
            ...challenge,
            metadata,
            phaseData,
            displayLanguage: metadata?.lang || challenge.defaultLanguage || 'pt',
          };
        })
      );

      setChallenges(challengesWithMetadata);
    } catch (err) {
      console.error('[DesafiosPage] Error loading desafios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Desafios</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Idioma:</span>
          <span className="text-2xl">{LANGUAGE_FLAGS[currentLanguage] || '🏳️'}</span>
        </div>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <Trophy className="text-brand-400" size={28} />
          <div>
            <h2 className="text-xl font-bold text-white">Conquiste certificados e ganhe CAS</h2>
            <p className="text-sm text-slate-400">
              Cada desafio oferece um certificado verificável on-chain e cashback em tokens CAS.
              Complete as tarefas, apresente as provas e receba seu certificado de Sócio Fundador.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-800 pt-6" />

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Spinner size={24} className="text-brand-400" />
        </div>
      ) : error ? (
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar desafios</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="card text-center text-slate-400">
          <Trophy className="mx-auto mb-3 text-brand-400" size={32} />
          <p>Nenhum desafio cadastrado ainda. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <DesafioCard
              key={challenge.slug}
              slug={challenge.slug}
              title={challenge.metadata?.title || challenge.title}
              description={challenge.metadata?.description || challenge.description}
              availableLanguages={challenge.availableLanguages}
              currentLanguage={challenge.displayLanguage}
              headerImage={challenge.metadata?.headerImage}
              status={challenge.metadata?.status || 'liberado'}
              phaseData={challenge.phaseData}
              cashbackRate={challenge.metadata?.cashbackRate || 0}
              requiredCertificateIds={challenge.metadata?.requiredCertificateIds || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesafiosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <DesafiosPageContent />
    </Suspense>
  );
}
