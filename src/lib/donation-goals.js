const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validCents = value => Number.isSafeInteger(value) && value >= 0;

export function calculateDonationGoals(data, report, month, today = new Date().toISOString().slice(0, 10)) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !validDate(today)) throw new Error('INVALID_PERIOD');
  const goalCents = Math.round(data.goal.monthlyUsd * 100);
  if (!validCents(goalCents) || goalCents === 0) throw new Error('INVALID_GOAL');
  const manual = new Map();
  for (const entry of data.dailyTotals || []) {
    if (!validDate(entry.date) || manual.has(entry.date) || !validCents(entry.amountBrlCents) || !validCents(entry.amountUsdCents) || (entry.brlPerUsd != null && (!Number.isFinite(entry.brlPerUsd) || entry.brlPerUsd <= 0))) throw new Error('INVALID_DAILY_TOTAL');
    manual.set(entry.date, entry);
  }
  const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  const seen = new Set();
  const scan = new Map();
  for (const row of report?.donations || []) {
    const date = typeof row.date === 'string' ? row.date.slice(0, 10) : '';
    if (!validDate(date) || typeof row.id !== 'string' || seen.has(row.id)) continue;
    seen.add(row.id);
    const day = scan.get(date) || { cents: 0, pending: 0 };
    const amount = row.equivalentUsdc == null ? NaN : Number(row.equivalentUsdc);
    const price = report?.usdcUsd;
    if (Number.isFinite(amount) && amount >= 0 && Number.isFinite(price) && price > 0 && Number.isSafeInteger(Math.round(amount * price * 100))) day.cents += Math.round(amount * price * 100);
    else day.pending++;
    scan.set(date, day);
  }
  let confirmedCents = 0;
  let estimatedCents = 0;
  let pending = 0;
  let consolidatedDays = 0;
  const daily = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    if (date > today) break;
    const entry = manual.get(date);
    let cents = 0;
    let unconverted = 0;
    if (entry) {
      cents = entry.amountUsdCents;
      if (entry.amountBrlCents > 0) {
        if (entry.brlPerUsd) cents += Math.round(entry.amountBrlCents / entry.brlPerUsd);
        else unconverted++;
      }
      confirmedCents += cents;
      if (!unconverted) consolidatedDays++;
    } else {
      const chainDay = scan.get(date);
      cents = chainDay?.cents || 0;
      unconverted = chainDay?.pending || 0;
      for (const pix of data.pixDonations || []) {
        if (pix.date !== date) continue;
        if (validCents(pix.amountCents) && Number.isFinite(pix.brlPerUsd) && pix.brlPerUsd > 0) cents += Math.round(pix.amountCents / pix.brlPerUsd);
        else unconverted++;
      }
      estimatedCents += cents;
    }
    pending += unconverted;
    daily.push({ date, day, source: entry ? 'Consolidado manual' : 'Parcial / scan', pending: unconverted, amountUsd: cents / 100, confirmedUsd: confirmedCents / 100, totalUsd: (confirmedCents + estimatedCents) / 100, paceUsd: data.goal.monthlyUsd * day / daysInMonth });
  }
  const totalCents = confirmedCents + estimatedCents;
  return { daily, confirmedUsd: confirmedCents / 100, estimatedUsd: estimatedCents / 100, totalUsd: totalCents / 100, remainingUsd: Math.max(0, goalCents - totalCents) / 100, percent: totalCents / goalCents * 100, reached: totalCents >= goalCents, pending, consolidatedDays, provisional: pending > 0 || consolidatedDays < daily.length || !daily.length, scanUnavailable: !report || Boolean(report.warnings?.length) };
}
