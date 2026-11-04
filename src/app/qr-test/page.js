'use client';

/**
 * Página estática para testar a leitura de vouchers sem executar operações financeiras.
 * Aceita código por formulário ou `?code=` e registra somente um TEST_SCAN no backend.
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, Search, ShieldCheck } from 'lucide-react';
import { qrClaimRequest } from '@/lib/api';

function QrTestContent() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function validate(event) {
    event.preventDefault();
    setError('');
    if (!/^[0-9a-fA-F]{64}$/.test(code.trim())) {
      setError('Informe um código hexadecimal de 64 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const response = await qrClaimRequest('/qr-test/validate', { code: code.trim() });
      if (response.status !== 200) {
        setError(`[${response.data?.code || 'VALIDATION_ERROR'}] ${response.data?.message || response.data?.error || 'Voucher inválido.'}`);
      } else {
        setResult(response.data);
      }
    } catch {
      setError('Falha de rede ao testar o QR Code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <section className="card space-y-6">
        <div className="flex items-center gap-3"><QrCode className="text-brand-400" size={32} /><div><h1 className="text-2xl font-bold text-white">Teste de QR Code</h1><p className="text-sm text-slate-400">Validação não financeira; nenhuma carteira ou transação é usada.</p></div></div>
        <form onSubmit={validate} className="space-y-3">
          <label className="label" htmlFor="voucher-code">Código do voucher</label>
          <textarea id="voucher-code" className="input min-h-24 w-full font-mono text-sm" value={code} onChange={(event) => setCode(event.target.value)} placeholder="64 caracteres hexadecimais" />
          <button className="btn-primary" disabled={loading}><Search size={17} /> {loading ? 'Validando…' : 'Testar leitura'}</button>
        </form>
        {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {result && <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4"><p className="flex items-center gap-2 font-semibold text-green-300"><ShieldCheck size={18} /> Voucher reconhecido</p><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Campanha</dt><dd className="text-white">{result.campaign?.name}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="font-mono text-white">{result.voucher?.status}</dd></div></dl><p className="mt-3 text-xs text-slate-400">Teste registrado. Nenhum resgate ou operação financeira foi iniciado.</p></div>}
      </section>
    </main>
  );
}

export default function QrTestPage() {
  return <Suspense fallback={<main className="p-12 text-center text-slate-400">Carregando…</main>}><QrTestContent /></Suspense>;
}
