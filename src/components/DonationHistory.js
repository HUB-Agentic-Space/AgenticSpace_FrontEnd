'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { DONATION_CHAINS } from '@/lib/donations';

export default function DonationHistory({ onReport }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/transparency/donations`, { signal: controller.signal });
        if (!response.ok) throw new Error('HISTORY_UNAVAILABLE');
        const data = await response.json();
        if (!Array.isArray(data.donations)) throw new Error('INVALID_REPORT');
        if (active) { setReport(data); setError(false); onReport?.(data); }
      } catch {
        if (active) { setError(true); setReport(null); onReport?.(null); }
      }
    }
    load();
    const interval = setInterval(load, 300000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [onReport]);

  return (
    <section className="card space-y-4" aria-labelledby="donation-history-title">
      <h2 id="donation-history-title" className="font-semibold text-white">Recebimentos on-chain</h2>
      <p className="text-xs text-slate-400">Atualização automática a cada 5 minutos. Transferências recebidas não comprovam, por si só, intenção de doação. Até 100 registros recentes por tipo e rede. Equivalente estimado pela cotação atual CoinGecko, não pela cotação do recebimento.</p>
      {error && <p role="alert" className="text-sm text-amber-300">DONATIONS_UNAVAILABLE — Histórico indisponível. Tente novamente em cinco minutos ou consulte os explorers acima.</p>}
      {!report && !error && <p role="status">Carregando recebimentos…</p>}
      {report && (
        <>
          <p className="text-xs text-slate-400">Consulta: {new Date(report.updatedAt).toLocaleString('pt-BR')}</p>
          {report.warnings?.map((warning, index) => <p key={index} className="text-xs text-amber-300">{warning.code} — {warning.chainId ? `Rede ${warning.chainId}: ` : ''}{warning.message}</p>)}
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
    </section>
  );
}
