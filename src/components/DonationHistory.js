'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { DONATION_CHAINS } from '@/lib/donations';

function mergeReports(parts) {
  const ready = parts.filter(part => part.status === 'ready' && part.report);
  if (!ready.length) return null;
  return {
    wallet: ready[0].report.wallet,
    updatedAt: ready.map(part => part.report.updatedAt).sort().at(-1),
    priceSource: ready.map(part => part.report.priceSource).find(Boolean) || null,
    usdcUsd: ready.map(part => part.report.usdcUsd).find(value => Number.isFinite(value) && value > 0) ?? null,
    brlPerUsd: ready.map(part => part.report.brlPerUsd).find(value => Number.isFinite(value) && value > 0) ?? null,
    valuation: 'current',
    donations: ready.flatMap(part => part.report.donations || []).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    networks: ready.flatMap(part => part.report.networks || []),
    warnings: ready.flatMap(part => part.report.warnings || [])
  };
}

export default function DonationHistory({ onReport }) {
  const [chains, setChains] = useState(() => DONATION_CHAINS.map(chain => ({ chainId: chain.chainId, label: chain.label, status: 'loading', report: null })));
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setChains(DONATION_CHAINS.map(chain => ({ chainId: chain.chainId, label: chain.label, status: 'loading', report: null })));
      await Promise.all(DONATION_CHAINS.map(async chain => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/transparency/donations?chainId=${chain.chainId}`, { signal: controller.signal });
          if (!response.ok) throw new Error('HISTORY_UNAVAILABLE');
          const data = await response.json();
          if (!Array.isArray(data.donations)) throw new Error('INVALID_REPORT');
          if (active) setChains(previous => previous.map(part => part.chainId === chain.chainId ? { ...part, status: 'ready', report: data } : part));
        } catch {
          if (active) setChains(previous => previous.map(part => part.chainId === chain.chainId ? { ...part, status: 'error' } : part));
        }
      }));
    }
    load();
    const interval = setInterval(load, 300000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, []);

  const report = useMemo(() => mergeReports(chains), [chains]);
  useEffect(() => { onReport?.(report); }, [report, onReport]);

  return (
    <section className="card space-y-4" aria-labelledby="donation-history-title">
      <h2 id="donation-history-title" className="font-semibold text-white">Recebimentos on-chain</h2>
      <p className="text-xs text-slate-400">Cada rede é consultada de forma assíncrona e atualizada a cada 5 minutos. Transferências recebidas não comprovam, por si só, intenção de doação. Até 100 registros recentes por tipo e rede. Equivalente estimado pela cotação atual CryptoCompare, não pela cotação do recebimento.</p>
      <ul className="flex flex-wrap gap-3" aria-label="Status das consultas por rede">
        {chains.map(part => (
          <li key={part.chainId} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300" data-testid={`history-status-${part.chainId}`}>
            {part.status === 'loading' && <span role="status" aria-label={`Consultando ${part.label}`} className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-brand-400" />}
            {part.status === 'ready' && <span aria-hidden="true" className="text-emerald-400">✓</span>}
            {part.status === 'error' && <span aria-hidden="true" className="text-amber-300">!</span>}
            {part.label}
            {part.status === 'error' && <span className="text-amber-300">— indisponível</span>}
          </li>
        ))}
      </ul>
      {report?.warnings?.map((warning, index) => <p key={index} className="text-xs text-amber-300">{warning.code} — {warning.chainId ? `Rede ${warning.chainId}: ` : ''}{warning.message}</p>)}
      {report && (
        <>
          <p className="text-xs text-slate-400">Consulta: {new Date(report.updatedAt).toLocaleString('pt-BR')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-700"><th className="p-2">Rede</th><th className="p-2">Origem</th><th className="p-2">Dia (UTC)</th><th className="p-2">Valor</th><th className="p-2">Moeda</th><th className="p-2">Equivalente USDC</th></tr></thead>
              <tbody>
                {report.donations.map(row => {
                  const chain = DONATION_CHAINS.find(item => item.chainId === row.chainId);
                  return <tr key={row.id} className="border-b border-slate-800"><td className="p-2">{row.network}</td><td className="p-2"><a href={chain?.explorer(row.from)} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-brand-400">{row.from}</a></td><td className="whitespace-nowrap p-2">{row.date.slice(0, 10)}</td><td className="p-2">{row.amount}</td><td className="p-2">{row.currency}</td><td className="p-2">{row.equivalentUsdc == null ? 'Cotação indisponível' : Number(row.equivalentUsdc).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          {report.donations.length === 0 && <p className="text-sm text-slate-400">Nenhum recebimento disponível nas consultas concluídas. Consulte os avisos de rede antes de interpretar este resultado.</p>}
        </>
      )}
      {!report && chains.every(part => part.status === 'error') && <p role="alert" className="text-sm text-amber-300">DONATIONS_UNAVAILABLE — Histórico indisponível. Tente novamente em cinco minutos ou consulte os explorers acima.</p>}
    </section>
  );
}
