'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/lib/auth-context';
import { updateCommunityPushSetting } from '@/lib/web-push';

/**
 * Toggle push compacto para notificações de uma comunidade específica.
 *
 * Props:
 *  - communityPublicId: string
 *  - initialEnabled?: boolean
 *  - disabled?: boolean
 *  - onChange?: (enabled: boolean) => void
 *  - className?: string
 */
export default function CommunityPushToggle({
  communityPublicId,
  initialEnabled = false,
  disabled = false,
  onChange,
  className = ''
}) {
  const { jwt } = useAuth();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || disabled || !jwt) return;

    const next = !enabled;
    setLoading(true);
    setError('');
    try {
      await updateCommunityPushSetting(communityPublicId, next, jwt);
      setEnabled(next);
      onChange?.(next);
    } catch (err) {
      setError(err?.message || 'Falha ao alterar.');
    } finally {
      setLoading(false);
    }
  }, [communityPublicId, disabled, enabled, jwt, loading, onChange]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !jwt}
      title={enabled ? 'Desativar notificações desta comunidade' : 'Ativar notificações desta comunidade'}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        enabled
          ? 'border-brand-500/50 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20'
          : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
      } ${disabled || loading || !jwt ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading ? (
        <Spinner size={12} className="text-current" />
      ) : enabled ? (
        <Bell size={14} />
      ) : (
        <BellOff size={14} />
      )}
      <span>{enabled ? 'Notificando' : 'Notificar'}</span>
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}
