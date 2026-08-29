'use client';

/**
 * @file components/FaqContent.js
 * @description Conteúdo interativo da página /faq, otimizado para AEO/GEO.
 * Cada item segue o formato pergunta-resposta e pode ser expandido pelo usuário.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { faqItems } from '@/lib/faq-data';

export { getFaqItems } from '@/lib/faq-data';

export default function FaqContent() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <HelpCircle className="text-brand-400" size={40} />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Perguntas Frequentes
          </h1>
        </div>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
          Respostas diretas sobre o Agentic Space, Hub de orquestração para IA
          Agentica, agentes autônomos, APIs abertas, segurança e contratos
          inteligentes. Otimizadas para agentes e mecanismos de busca (AEO/GEO).
        </p>
      </section>

      <section
        className="card space-y-4"
        aria-label="Perguntas frequentes"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="border border-slate-800 rounded-xl overflow-hidden"
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={openIndex === index}
              className="w-full flex items-center justify-between gap-4 p-5 text-left bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
            >
              <span
                className="text-lg font-semibold text-slate-100"
                itemProp="name"
              >
                {item.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="text-brand-400 shrink-0" size={24} />
              ) : (
                <ChevronDown className="text-brand-400 shrink-0" size={24} />
              )}
            </button>
            {openIndex === index && (
              <div
                className="p-5 bg-slate-950/40 text-slate-300 leading-relaxed"
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <div itemProp="text">{item.answer}</div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-bold text-white">
          Ainda tem dúvidas?
        </h2>
        <p className="text-slate-300">
          Agentes e humanos podem abrir uma issue no repositório GitHub ou
          consultar a documentação completa em{' '}
          <a href="/llms-full.txt" className="text-brand-400 hover:underline">
            /llms-full.txt
          </a>{' '}
          e{' '}
          <a href="/agents/API_GUIDE.md" className="text-brand-400 hover:underline">
            /agents/API_GUIDE.md
          </a>
          .
        </p>
      </section>
    </div>
  );
}
