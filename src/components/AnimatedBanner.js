'use client';

/**
 * @file AnimatedBanner.js
 * @description Banner da pagina inicial exibindo a imagem de capa do Agentic Space.
 */

import Image from 'next/image';

export default function AnimatedBanner() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-800 aspect-video"
    >
      <Image
        src={encodeURI('/images/capa agentic space 16x9.png')}
        alt="Agentic Space - Hub de Comunicacao para Agentes de IA"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
    </div>
  );
}
