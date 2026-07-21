'use client';

/**
 * @file WalletErrorModal.js
 * @description Modal reutilizável para exibição de erros de wallet com
 * mensagens amigáveis ao usuário leigo. Segue a paleta Rapport (dark theme).
 */

import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Wallet,
  Fuel,
  Network,
  ArrowRight,
} from 'lucide-react';

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-300',
    titleColor: 'text-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-100',
    titleColor: 'text-amber-200',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-100',
    titleColor: 'text-blue-200',
  },
};

/**
 * @param {{
 *   error: {
 *     title: string,
 *     message: string,
 *     details: Object,
 *     severity: 'error'|'warning'|'info',
 *     code: string,
 *   } | null,
 *   onClose: () => void,
 * }} props
 */
export default function WalletErrorModal({ error, onClose }) {
  if (!error) return null;

  const cfg = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.error;
  const Icon = cfg.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className={`flex items-center gap-2 text-lg font-semibold ${cfg.titleColor}`}>
            <Icon size={22} className={cfg.iconColor} />
            {error.title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div className={`flex items-start gap-3 rounded-lg border ${cfg.borderColor} ${cfg.bgColor} p-4`}>
          <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.iconColor}`} />
          <p className={`text-sm leading-relaxed ${cfg.textColor}`}>
            {error.message}
          </p>
        </div>

        {/* Details */}
        {error.details && Object.keys(error.details).length > 0 && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            {error.details.walletAddress && (
              <div className="flex items-center gap-2 text-sm">
                <Wallet size={14} className="shrink-0 text-slate-500" />
                <span className="text-slate-500">Carteira:</span>
                <span className="font-mono text-xs text-slate-300">
                  {error.details.walletAddress}
                </span>
              </div>
            )}
            {error.details.gasEstimate && (
              <div className="flex items-center gap-2 text-sm">
                <Fuel size={14} className="shrink-0 text-slate-500" />
                <span className="text-slate-500">Taxa de gas estimada:</span>
                <span className="font-mono text-xs text-slate-300">
                  {error.details.gasEstimate}
                </span>
              </div>
            )}
            {error.details.networkName && (
              <div className="flex items-center gap-2 text-sm">
                <Network size={14} className="shrink-0 text-slate-500" />
                <span className="text-slate-500">Rede:</span>
                <span className="text-xs text-slate-300">
                  {error.details.networkName}
                </span>
              </div>
            )}
            {error.details.nextStep && (
              <div className="flex items-start gap-2 border-t border-slate-700/50 pt-2 text-sm">
                <ArrowRight size={14} className="mt-0.5 shrink-0 text-brand-400" />
                <span className="text-slate-400">
                  {error.details.nextStep}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
