'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import Spinner from '@/components/Spinner';

/**
 * Toggle push-pull para ativar/desativar notificações.
 *
 * Props:
 *  - enabled: boolean
 *  - onChange: (enabled: boolean) => Promise<void> | void
 *  - label?: string
 *  - description?: string
 *  - disabled?: boolean
 *  - className?: string
 */
export default function PushNotificationToggle({
  enabled = false,
  onChange,
  label = 'Notificações push',
  description = '',
  disabled = false,
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (disabled || loading || !onChange) return;
    setLoading(true);
    setError('');
    try {
      await onChange(!enabled);
    } catch (err) {
      setError(err?.message || 'Falha ao alterar preferência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              enabled ? 'bg-brand-600/20 text-brand-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-medium text-slate-100">{label}</span>
            {description && (
              <span className="block text-xs text-slate-400 truncate">{description}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={disabled || loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            enabled ? 'bg-brand-600' : 'bg-slate-700'
          } ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="sr-only">{label}</span>
          <span
            className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          >
            {loading && <Spinner size={10} className="text-slate-900" />}
          </span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
