'use client';

import { useEffect } from 'react';

const RECOVERY_KEY = 'agentic_space_chunk_recovery';
const RECOVERY_WINDOW_MS = 30_000;

function isChunkFailure(event) {
  const target = event?.target;
  if (target?.tagName === 'SCRIPT' && target.src?.includes('/_next/static/')) return true;

  const reason = event?.reason || event?.error || event;
  const message = String(reason?.message || reason || '');
  return /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(message);
}

function recoverFromStaleBuild() {
  const previousAttempt = Number(sessionStorage.getItem(RECOVERY_KEY) || 0);
  if (Date.now() - previousAttempt < RECOVERY_WINDOW_MS) return;

  sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  const url = new URL(window.location.href);
  url.searchParams.set('__reload', String(Date.now()));
  window.location.replace(url.toString());
}

export default function ChunkRecovery() {
  useEffect(() => {
    const handleFailure = (event) => {
      if (isChunkFailure(event)) recoverFromStaleBuild();
    };
    window.addEventListener('error', handleFailure, true);
    window.addEventListener('unhandledrejection', handleFailure);
    const timer = window.setTimeout(
      () => sessionStorage.removeItem(RECOVERY_KEY),
      RECOVERY_WINDOW_MS
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('error', handleFailure, true);
      window.removeEventListener('unhandledrejection', handleFailure);
    };
  }, []);

  return null;
}
