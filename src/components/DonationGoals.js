'use client';

import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculateDonationGoals } from '@/lib/donation-goals';

const usd = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);
const BRL_FX_URL = 'https://api.exchangerate-api.com/v4/latest/BRL';

export default function DonationGoals({ data, report }) {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [brlPerUsd, setBrlPerUsd] = useState(null);
  useEffect(() => {
    let active = true;
    fetch(BRL_FX_URL)
      .then(response => (response.ok ? response.json() : null))
      .then(body => {
        const usdRate = Number(body?.rates?.USD);
        if (active) setBrlPerUsd(Number.isFinite(usdRate) && usdRate > 0 ? 1 / usdRate : null);
      })
      .catch(() => { if (active) setBrlPerUsd(null); });
    return () => { active = false; };
  }, []);
  const backendRate = Number.isFinite(report?.brlPerUsd) && report.brlPerUsd > 0 ? report.brlPerUsd : null;
  const effectiveRate = backendRate || brlPerUsd;
  const rateSource = backendRate ? 'CryptoCompare' : 'exchangerate-api';
  const summary = calculateDonationGoals(data, report, month, today, { brlPerUsd: effectiveRate });
  return (
    <section className="card min-w-0 space-y-4" aria-labelledby="donation-goals-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="donation-goals-title" className="font-semibold text-white">Progresso da meta mensal</h2>
        <label className="text-sm text-slate-300">Mês (UTC)
          <input aria-label="Mês da arrecadação" type="month" value={month} max={today.slice(0, 7)} onChange={event => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) setMonth(event.target.value); }} className="input ml-2 w-40" />
        </label>
      </div>
      <p className="text-sm text-slate-300">{summary.reached ? 'Meta atingida' : summary.provisional ? 'Meta ainda não comprovada' : 'Meta ainda não atingida'}{summary.provisional ? ' — dados parciais / estimados' : ''}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 p-3"><p className="text-xs text-slate-400">Arrecadação conhecida / estimada</p><p className="text-xl text-brand-400" data-testid="goal-total">{usd(summary.totalUsd)}</p></div>
        <div className="rounded-lg border border-slate-700 p-3"><p className="text-xs text-slate-400">Meta mensal</p><p className="text-xl text-white">{usd(data.goal.monthlyUsd)}</p></div>
        <div className="rounded-lg border border-slate-700 p-3"><p className="text-xs text-slate-400">Falta para a meta (com os dados disponíveis)</p><p className="text-xl text-white">{usd(summary.remainingUsd)}</p></div>
      </div>
      <progress aria-label="Percentual da meta mensal" max="100" value={Math.min(100, summary.percent)} className="h-3 w-full accent-orange-400" />
      <p className="text-sm text-slate-300">{summary.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da meta · Consolidado: {usd(summary.confirmedUsd)} · Parcial / scan: {usd(summary.estimatedUsd)}</p>
      <p className="text-xs text-slate-400">O total consolidado informado para um dia substitui PIX e scan desse dia, sem duplicidade. Reais usam a cotação registrada (R$ por US$ 1) quando disponível{summary.brlPerUsd ? `; sem cotação histórica, usa-se a cotação atual ${rateSource} (R$ ${summary.brlPerUsd.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} por US$ 1)` : '; sem cotação disponível, o valor fica pendente'}. Dias sem consolidação usam registros PIX com câmbio e estimativas do scan pela cotação atual CoinGecko USDC/USD. Todos os dias seguem UTC.</p>
      <p className="text-xs text-slate-400">Dias consolidados com conversão completa: {summary.consolidatedDays}/{summary.daily.length}. Registros sem cotação: {summary.pending}; seus valores não estão incluídos. Ausência de registro não comprova arrecadação zero.</p>
      {summary.scanUnavailable && <p role="status" className="text-xs text-amber-300">Scan indisponível, incompleto ou com avisos. O progresso pode estar subestimado; consulte o extrato.</p>}
      <div className="h-72 min-w-0" data-testid="donation-goal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={summary.daily} accessibilityLayer title="Arrecadação acumulada em USD e meta mensal" margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#94a3b8" tickFormatter={value => String(value).padStart(2, '0')} />
            <YAxis stroke="#94a3b8" width={55} domain={[0, maximum => Math.max(maximum, data.goal.monthlyUsd)]} />
            <Tooltip formatter={value => usd(Number(value))} labelFormatter={value => `Dia ${value} (UTC)`} contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
            <Legend />
            <ReferenceLine y={data.goal.monthlyUsd} stroke="#fdba74" strokeDasharray="4 4" label={{ value: 'Meta mensal', fill: '#fdba74', position: 'insideTopRight' }} />
            <Line dataKey="totalUsd" name="Total conhecido / estimado" stroke="#fb923c" dot={false} isAnimationActive={false} />
            <Line dataKey="confirmedUsd" name="Consolidado manual" stroke="#cbd5e1" dot={false} isAnimationActive={false} />
            <Line dataKey="paceUsd" name="Ritmo proporcional da meta" stroke="#94a3b8" strokeDasharray="3 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm text-slate-300">
        <summary className="cursor-pointer">Ver valores diários do gráfico</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
          <caption className="sr-only">Arrecadação diária e acumulada em dólares</caption>
          <thead><tr><th scope="col" className="p-2">Dia (UTC)</th><th scope="col" className="p-2">Fonte</th><th scope="col" className="p-2">Conhecido no dia</th><th scope="col" className="p-2">Acumulado</th><th scope="col" className="p-2">Sem cotação</th></tr></thead>
          <tbody>{summary.daily.map(row => <tr key={row.date} className="border-t border-slate-800"><td className="whitespace-nowrap p-2">{row.date}</td><td className="p-2">{row.source}</td><td className="p-2">{usd(row.amountUsd)}</td><td className="p-2">{usd(row.totalUsd)}</td><td className="p-2">{row.pending}</td></tr>)}</tbody>
        </table></div>
      </details>
    </section>
  );
}
