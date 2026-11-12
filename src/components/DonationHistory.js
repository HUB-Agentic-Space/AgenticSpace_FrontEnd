'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { DONATION_CHAINS } from '@/lib/donations';

const BLOCKLIST_URL = '/data/fake_phishing.csv';

/** Extrai endereços EVM da lista CSV de phishing (coluna `address`). */
function parseBlocklist(text) {
  return new Set(
    String(text)
      .split(/\r?\n/)
      .map(line => line.split(',')[0].trim().toLowerCase())
      .filter(value => /^0x[0-9a-f]{40}$/.test(value))
  );
}

/** Remove recebimentos originados de endereços sinalizados como phishing. */
function filterDonations(donations, blocked) {
  return donations.filter(row => !blocked.has(String(row.from || '').toLowerCase()));
}

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
  const [blocked, setBlocked] = useState(() => new Set());
  const blockedRef = useRef(blocked);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const reports = new Map();
    let first = true;
    async function loadBlocklist() {
      try {
        const response = await fetch(BLOCKLIST_URL, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const next = parseBlocklist(await response.text());
        blockedRef.current = next;
        if (active) setBlocked(next);
      } catch {
        // Mantém a lista anterior em caso de falha de leitura.
      }
    }
    async function load() {
      if (!first) {
        reports.clear();
        setChains(DONATION_CHAINS.map(chain => ({ chainId: chain.chainId, label: chain.label, status: 'loading', report: null })));
      }
      first = false;
      await loadBlocklist();
      await Promise.all(DONATION_CHAINS.map(async chain => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/transparency/donations?chainId=${chain.chainId}`, { signal: controller.signal });
          if (!response.ok) throw new Error('HISTORY_UNAVAILABLE');
          const data = await response.json();
          if (!Array.isArray(data.donations)) throw new Error('INVALID_REPORT');
          if (!active) return;
          reports.set(chain.chainId, data);
          setChains(previous => previous.map(part => part.chainId === chain.chainId ? { ...part, status: 'ready', report: data } : part));
          const merged = mergeReports([...reports.values()].map(report => ({ status: 'ready', report })));
          if (merged) merged.donations = filterDonations(merged.donations, blockedRef.current);
          onReport?.(merged);
        } catch {
          if (active) setChains(previous => previous.map(part => part.chainId === chain.chainId ? { ...part, status: 'error' } : part));
        }
      }));
    }
    load();
    const interval = setInterval(load, 300000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [onReport]);

  const report = useMemo(() => mergeReports(chains), [chains]);
  const visibleDonations = useMemo(() => filterDonations(report?.donations || [], blocked), [report, blocked]);
  const hiddenCount = (report?.donations.length || 0) - visibleDonations.length;
  const months = useMemo(() => {
    const groups = new Map();
    for (const row of visibleDonations) {
      const month = row.date.slice(0, 7);
      if (!groups.has(month)) groups.set(month, []);
      groups.get(month).push(row);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [visibleDonations]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const activeMonth = selectedMonth || months[0]?.[0] || '';
  const activeGroup = months.find(([month]) => month === activeMonth) || null;

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
          {months.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="history-month-picker" className="text-xs text-slate-400">Período (mês/ano):</label>
              <input
                id="history-month-picker"
                type="month"
                min={months[months.length - 1][0]}
                max={months[0][0]}
                value={activeMonth}
                onChange={event => setSelectedMonth(event.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none [color-scheme:dark]"
                data-testid="history-month-picker"
              />
            </div>
          )}
          {activeGroup && (
            <div className="space-y-2">
              <h3 id={`history-month-${activeGroup[0]}`} className="text-sm font-semibold text-slate-100">
                {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${activeGroup[0]}-01T00:00:00Z`))} · {activeGroup[1].length} recebimentos
              </h3>
              <div role="region" aria-labelledby={`history-month-${activeGroup[0]}`} tabIndex={0} className="max-h-[27.5rem] overflow-auto rounded-lg border border-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500" data-testid={`history-month-${activeGroup[0]}`}>
                <table className="w-full table-fixed text-left text-sm min-w-[60rem]">
                  <thead className="sticky top-0 z-10 bg-slate-900"><tr className="h-10 border-b border-slate-700"><th scope="col" className="p-2">Rede</th><th scope="col" className="p-2">Origem</th><th scope="col" className="p-2">Dia (UTC)</th><th scope="col" className="p-2">Valor</th><th scope="col" className="p-2">Moeda</th><th scope="col" className="p-2">Equivalente USDC</th></tr></thead>
                  <tbody>
                    {activeGroup[1].map(row => {
                      const chain = DONATION_CHAINS.find(item => item.chainId === row.chainId);
                      return <tr key={row.id} className="h-10 border-b border-slate-800"><td className="truncate p-2" title={row.network}>{row.network}</td><td className="p-2"><a href={chain?.explorer(row.from)} title={row.from} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-brand-400">{row.from}</a></td><td className="whitespace-nowrap p-2">{row.date.slice(0, 10)}</td><td className="truncate p-2" title={row.amount}>{row.amount}</td><td className="truncate p-2">{row.currency}</td><td className="truncate p-2">{row.equivalentUsdc == null ? 'Cotação indisponível' : Number(row.equivalentUsdc).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!activeGroup && selectedMonth && <p className="text-sm text-slate-400">Nenhum recebimento registrado no período selecionado.</p>}
          {hiddenCount > 0 && <p className="text-xs text-slate-500">{hiddenCount} recebimento(s) de endereços sinalizados como phishing foram ocultados automaticamente.</p>}
          {report.donations.length === 0 && <p className="text-sm text-slate-400">Nenhum recebimento disponível nas consultas concluídas. Consulte os avisos de rede antes de interpretar este resultado.</p>}
        </>
      )}
      {!report && chains.every(part => part.status === 'error') && <p role="alert" className="text-sm text-amber-300">DONATIONS_UNAVAILABLE — Histórico indisponível. Tente novamente em cinco minutos ou consulte os explorers acima.</p>}
    </section>
  );
}
