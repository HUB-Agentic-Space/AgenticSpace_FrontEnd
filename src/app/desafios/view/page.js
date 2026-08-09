'use client';

/**
 * @file page.js (rota '/desafios/view?slug=<slug>')
 * @description Página de visualização de um desafio específico com suporte a
 * múltiplos idiomas, dados on-chain (preço, cashback, pré-requisitos,
 * habilidades) e renderização de markdown.
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  AlertCircle,
  Globe,
  Coins,
  Gift,
  CheckCircle2,
  Lock,
  Award,
  BookOpen,
  ListChecks,
  Clock,
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import matter from 'gray-matter';
import { ethers } from 'ethers';
import {
  fetchPhase,
  getCertificateContract,
  loadCertificateConfig,
  formatCasAmount,
} from '@/lib/certificates';
import TutorialLanguageSelector from '@/components/TutorialLanguageSelector';

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

function DesafioViewerContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const [desafio, setDesafio] = useState(null);
  const [content, setContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('pt');
  const [availableLanguages, setAvailableLanguages] = useState(['pt']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [phaseData, setPhaseData] = useState(null);
  const [prerequisites, setPrerequisites] = useState([]);

  useEffect(() => {
    if (slug) {
      loadDesafio();
    }
  }, [slug, searchParams]);

  async function loadDesafio() {
    try {
      setLoading(true);
      setError(null);
      setIsFallback(false);
      setPhaseData(null);
      setPrerequisites([]);

      const indexResponse = await fetch('/desafios/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar lista de desafios');
      }
      const indexData = await indexResponse.json();

      const desafioData = indexData.challenges.find(c => c.slug === slug);
      if (!desafioData) {
        throw new Error('Desafio não encontrado');
      }

      setAvailableLanguages(desafioData.availableLanguages || ['pt']);

      const preferredLang = getPreferredLanguage();
      setCurrentLanguage(preferredLang);

      let contentResponse = await fetch(`/desafios/${slug}/desafio-${preferredLang}.md`);
      let loadedLang = preferredLang;

      if (!contentResponse.ok && desafioData.defaultLanguage) {
        contentResponse = await fetch(`/desafios/${slug}/desafio-${desafioData.defaultLanguage}.md`);
        loadedLang = desafioData.defaultLanguage;
        setIsFallback(true);
      }

      if (!contentResponse.ok && desafioData.availableLanguages && desafioData.availableLanguages.length > 0) {
        contentResponse = await fetch(`/desafios/${slug}/desafio-${desafioData.availableLanguages[0]}.md`);
        loadedLang = desafioData.availableLanguages[0];
        setIsFallback(true);
      }

      if (!contentResponse.ok) {
        throw new Error('Conteúdo do desafio não encontrado');
      }

      const contentData = await contentResponse.text();
      const { data, content: markdownContent } = matter(contentData);

      const phaseId = data.certificatePhaseId || desafioData.certificatePhaseId;
      const cashbackRate = data.cashbackRate || 0;
      const requiredCertificateIds = Array.isArray(data.requiredCertificateIds)
        ? data.requiredCertificateIds.map(String)
        : [];

      setDesafio({
        ...desafioData,
        title: data.title || desafioData.title,
        description: data.description || desafioData.description,
        headerImage: data.headerImage,
        status: data.status || 'liberado',
        certificatePhaseId: phaseId,
        cashbackRate,
        requiredCertificateIds,
      });
      setContent(markdownContent);
      setCurrentLanguage(loadedLang);

      if (phaseId) {
        const config = await loadCertificateConfig();
        if (config?.certificateAddress && ethers.isAddress(config.certificateAddress)) {
          try {
            const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
            const contract = getCertificateContract(config.certificateAddress, provider);
            const phase = await fetchPhase(contract, provider, BigInt(phaseId));
            setPhaseData({
              minCasDeposit: phase.minCasDeposit?.toString() || '0',
              active: phase.active === 1 || phase.active === true,
              skillsDescription: phase.skillsDescription || '',
              instructions: phase.instructions || '',
              name: phase.name || '',
              minted: phase.minted?.toString() || '0',
            });

            try {
              const prereqIds = await contract.phasePrerequisites(BigInt(phaseId));
              setPrerequisites(prereqIds.map(id => id.toString()));
            } catch {
              setPrerequisites([]);
            }
          } catch (err) {
            console.warn('[DesafioViewer] Failed to load phase data:', err?.message || err);
          }
        }
      }
    } catch (err) {
      console.error('[DesafioViewer] Error loading desafio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <Link href="/desafios" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Desafio</h1>
        </header>
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar desafio</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPlanejamento = desafio?.status === 'planejamento';
  const cashbackRate = desafio?.cashbackRate || 0;
  const priceEth = phaseData ? BigInt(phaseData.minCasDeposit) : 0n;
  const hasCashback = cashbackRate > 0;
  const cashbackEth = hasCashback && priceEth > 0n ? (Number(ethers.formatUnits(priceEth, 18)) * cashbackRate).toFixed(2) : null;
  const cashbackLabel = !hasCashback
    ? null
    : cashbackRate === 1
      ? '100% do valor pago'
      : cashbackRate > 1
        ? `Bônus de ${Math.round(cashbackRate * 100)}%`
        : `${Math.round(cashbackRate * 100)}% do valor pago`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/desafios" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-400" size={28} />
            <div>
              <h1 className="text-3xl font-bold text-white">{desafio.title}</h1>
              <p className="text-slate-400">{desafio.description}</p>
            </div>
          </div>
        </div>
        <TutorialLanguageSelector
          slug={slug}
          availableLanguages={availableLanguages}
          currentLanguage={currentLanguage}
        />
      </header>

      {isFallback && (
        <div className="card border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
          <div className="flex items-start gap-2">
            <Globe size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Desafio em outro idioma</p>
              <p className="text-sm">
                Este desafio não está disponível no seu idioma preferido. Exibindo versão em{' '}
                {currentLanguage === 'pt' ? 'português' : currentLanguage === 'en' ? 'inglês' : currentLanguage}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status badge */}
      {isPlanejamento && (
        <div className="card border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
          <div className="flex items-center gap-2">
            <Clock size={20} className="shrink-0" />
            <p className="font-semibold">Desafio em planejamento</p>
          </div>
          <p className="mt-1 text-sm text-yellow-100/90">
            Este desafio ainda não está liberado para participação. Volte em breve!
          </p>
        </div>
      )}

      {/* Info banner: status + cashback definidos no YAML */}
      {desafio?.status && hasCashback && (
        <div className="card border-brand-500/30 bg-brand-500/5">
          <div className="flex items-start gap-3">
            <Gift size={20} className="mt-0.5 text-brand-400 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Status:</strong>{' '}
                <span className={isPlanejamento ? 'text-yellow-300' : 'text-brand-400'}>
                  {isPlanejamento ? 'Em planejamento' : 'Liberado'}
                </span>
              </p>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Cashback:</strong>{' '}
                <span className="text-brand-300">{cashbackLabel}</span>
                {cashbackEth && (
                  <span className="text-slate-400">
                    {' '}— {Number(cashbackEth).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} CAS
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Required certificates from YAML */}
      {desafio?.requiredCertificateIds?.length > 0 && (
        <div className="card border-slate-700 bg-slate-900/40">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock size={16} className="text-brand-400" />
            Certificados necessários
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Você precisa possuir os seguintes certificados para concluir este desafio:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {desafio.requiredCertificateIds.map((certId, i) => (
              <li key={i} className="flex items-center gap-2">
                <Award size={14} className="text-brand-400 shrink-0" />
                Certificado fase #{certId}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* On-chain data section */}
      {phaseData && (
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Award size={22} className="text-brand-400" />
            Dados do Certificado
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Price */}
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <Coins size={20} className="mt-0.5 text-brand-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-400">Preço do certificado</p>
                <p className="text-lg font-semibold text-white">
                  {formatCasAmount(priceEth)}
                </p>
              </div>
            </div>

            {/* Cashback */}
            {hasCashback && (
              <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <Gift size={20} className="mt-0.5 text-brand-300 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-400">Cashback</p>
                  <p className="text-lg font-semibold text-white">
                    {cashbackEth ? `${Number(cashbackEth).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} CAS` : '—'}
                  </p>
                  <p className="text-xs text-brand-300">{cashbackLabel}</p>
                </div>
              </div>
            )}

            {/* Active status */}
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              {phaseData.active ? (
                <CheckCircle2 size={20} className="mt-0.5 text-brand-400 shrink-0" />
              ) : (
                <Lock size={20} className="mt-0.5 text-slate-500 shrink-0" />
              )}
              <div>
                <p className="text-xs font-medium text-slate-400">Status on-chain</p>
                <p className="text-lg font-semibold text-white">
                  {phaseData.active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {phaseData.skillsDescription && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <BookOpen size={16} className="text-brand-400" />
                Habilidades adquiridas
              </h3>
              <p className="mt-2 text-sm text-slate-300">{phaseData.skillsDescription}</p>
            </div>
          )}

          {/* Instructions */}
          {phaseData.instructions && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ListChecks size={16} className="text-brand-400" />
                Instruções para obtenção do certificado
              </h3>
              <p className="mt-2 text-sm text-slate-300">{phaseData.instructions}</p>
            </div>
          )}

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Lock size={16} className="text-brand-400" />
                Pré-requisitos
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {prerequisites.map((prereqId, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    Certificado fase #{prereqId}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          {!isPlanejamento && (
            <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
              <Link href="/certificado" className="btn-primary">
                <Award size={18} /> Iniciar desafio
              </Link>
              <Link href="/certificado/regras" className="btn-secondary">
                <BookOpen size={18} /> Ver regras
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Markdown content */}
      <div className="card">
        {desafio?.headerImage && (
          <img
            src={`/desafios/${slug}/${desafio.headerImage}`}
            alt={desafio.title}
            className="mb-6 w-full rounded-lg border border-slate-700 object-cover"
            style={{ maxHeight: '300px' }}
          />
        )}
        <div className="prose prose-invert prose-slate prose-headings:text-white prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-300 prose-a:text-brand-400 prose-strong:text-white prose-code:text-brand-300 prose-pre:bg-slate-800 prose-pre:text-slate-200 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded-lg border border-slate-700 my-4"
                  alt={props.alt || ''}
                />
              ),
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-brand-400 hover:text-brand-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code {...props} className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-brand-300">
                      {children}
                    </code>
                  );
                }
                return (
                  <code {...props} className="block bg-slate-800 p-4 rounded-lg overflow-x-auto text-slate-200">
                    {children}
                  </code>
                );
              },
              pre: ({ node, ...props }) => (
                <pre {...props} className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4">
                  {props.children}
                </pre>
              ),
              h1: ({ node, ...props }) => (
                <h1 {...props} className="text-3xl font-bold text-white mt-8 mb-4" />
              ),
              h2: ({ node, ...props }) => (
                <h2 {...props} className="text-2xl font-bold text-white mt-6 mb-3" />
              ),
              h3: ({ node, ...props }) => (
                <h3 {...props} className="text-xl font-bold text-white mt-4 mb-2" />
              ),
              ul: ({ node, ...props }) => (
                <ul {...props} className="list-disc pl-6 my-4 text-slate-300" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="list-decimal pl-6 my-4 text-slate-300" />
              ),
              li: ({ node, ...props }) => (
                <li {...props} className="my-1" />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote {...props} className="border-l-4 border-brand-500 pl-4 my-4 italic text-slate-400" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function DesafioViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} className="text-brand-400" />
      </div>
    }>
      <DesafioViewerContent />
    </Suspense>
  );
}
