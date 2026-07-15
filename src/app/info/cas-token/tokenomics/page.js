'use client';

/**
 * @file page.js (rota '/info/cas-token/tokenomics')
 * @description Renderiza o documento de tokenomics do CAS Token a partir
 *              do markdown em /public/tokens/tokenomics.md, com formatação
 *              estilo tutoriais (ReactMarkdown + remark-gfm).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, AlertCircle } from 'lucide-react';
import Spinner from '@/components/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function TokenomicsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/tokens/tokenomics.md');
        if (!res.ok) throw new Error('Falha ao carregar tokenomics');
        const text = await res.text();
        setContent(text);
      } catch (err) {
        console.error('[TokenomicsPage] load error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <Link href="/info/cas-token" className="btn-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
        </header>
        <div className="card border-red-500/40 bg-red-500/10 text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar tokenomics</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link href="/info/cas-token" className="btn-secondary">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 className="text-brand-400" size={28} />
          <h1 className="text-3xl font-bold text-white">CAS Tokenomics</h1>
        </div>
      </header>

      <div className="card">
        <div className="markdown-content max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
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
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
