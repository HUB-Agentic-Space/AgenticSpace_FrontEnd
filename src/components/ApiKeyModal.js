'use client';

/**
 * @file ApiKeyModal.js
 * @description Modal component for displaying regenerated API keys with copy functionality.
 * Replaces alert() dialogs to allow users to copy the key to clipboard.
 */

import { useState } from 'react';
import { X, Copy, Check, KeyRound, AlertTriangle } from 'lucide-react';

export default function ApiKeyModal({ apiKey, onClose }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-lg w-full border border-slate-700">
        <div className="bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="text-brand-400" size={24} />
            <h2 className="text-xl font-bold text-white">Chave de API Regenerada</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Importante</p>
              <p className="text-slate-300">
                Copie esta chave agora. Não será possível consultá-la novamente após fechar este modal.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Nova chave de API</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-200 break-all">
                {apiKey}
              </div>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2 px-4"
                aria-label="Copiar chave"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 btn-primary"
            >
              <Copy size={16} className="mr-2" />
              Copiar e fechar
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
