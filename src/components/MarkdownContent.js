'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/**
 * Renderizador de Markdown com estilos explicitos.
 *
 * O projeto nao usa o plugin @tailwindcss/typography, portanto as classes
 * `prose` nao produzem efeito. Este componente centraliza o mapeamento de
 * elementos para que qualquer texto Markdown (descricao de habilidades,
 * instrucoes de desafio, etc.) tenha espacamento e hierarquia legiveis.
 */
const COMPONENTS = {
  p: ({ node, ...props }) => (
    <p {...props} className="my-2 leading-relaxed text-slate-300 first:mt-0 last:mb-0" />
  ),
  h1: ({ node, ...props }) => (
    <h1 {...props} className="mb-2 mt-4 text-lg font-bold text-white first:mt-0" />
  ),
  h2: ({ node, ...props }) => (
    <h2 {...props} className="mb-2 mt-4 text-base font-bold text-white first:mt-0" />
  ),
  h3: ({ node, ...props }) => (
    <h3 {...props} className="mb-1.5 mt-3 text-sm font-bold text-white first:mt-0" />
  ),
  h4: ({ node, ...props }) => (
    <h4 {...props} className="mb-1.5 mt-3 text-sm font-semibold text-slate-100 first:mt-0" />
  ),
  ul: ({ node, ...props }) => (
    <ul {...props} className="my-2 list-disc space-y-1.5 pl-5 text-slate-300" />
  ),
  ol: ({ node, ...props }) => (
    <ol {...props} className="my-2 list-decimal space-y-1.5 pl-5 text-slate-300" />
  ),
  li: ({ node, ...props }) => <li {...props} className="leading-relaxed" />,
  strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-white" />,
  em: ({ node, ...props }) => <em {...props} className="italic text-slate-200" />,
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-brand-400 underline hover:text-brand-300"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      {...props}
      className="my-3 border-l-2 border-brand-500/40 pl-3 italic text-slate-400"
    />
  ),
  hr: ({ node, ...props }) => <hr {...props} className="my-4 border-slate-800" />,
  code: ({ node, inline, children, ...props }) => (
    inline ? (
      <code {...props} className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.85em] text-brand-300">
        {children}
      </code>
    ) : (
      <code {...props} className="block overflow-x-auto text-slate-200">
        {children}
      </code>
    )
  ),
  pre: ({ node, ...props }) => (
    <pre {...props} className="my-3 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs" />
  ),
  table: ({ node, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table {...props} className="w-full border-collapse text-left text-sm" />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="border-b border-slate-700 px-2 py-1.5 font-semibold text-white" />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border-b border-slate-800 px-2 py-1.5 text-slate-300" />
  ),
};

export default function MarkdownContent({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`text-sm ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={COMPONENTS}>
        {String(children)}
      </ReactMarkdown>
    </div>
  );
}
