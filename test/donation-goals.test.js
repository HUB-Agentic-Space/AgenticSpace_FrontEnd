import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDonationGoals } from '../src/lib/donation-goals.js';
import { readFile } from 'node:fs/promises';

test('TRANS-GOAL-04: published manual data satisfies the consolidation schema', async () => {
  const configured = JSON.parse(await readFile(new URL('../src/data/transparency.json', import.meta.url), 'utf8'));
  const result = calculateDonationGoals(configured, null, '2026-11', '2026-11-30');
  assert.equal(result.daily.length, 30);
  assert.equal(configured.goal.monthlyUsd, configured.expenses.reduce((sum, expense) => sum + expense.monthlyUsd, 0));
});

const data = { goal: { monthlyUsd: 165 }, dailyTotals: [], pixDonations: [] };
const report = { donations: [{ id: 'a', date: '2026-11-11T12:00:00Z', equivalentUsdc: '100' }], usdcUsd: 0.99, warnings: [] };
const calculate = (input = data, scan = report, month = '2026-11', today = '2026-11-11') => calculateDonationGoals(input, scan, month, today);

test('TRANS-GOAL-01: consolidated day replaces both PIX and scan with historical FX', () => {
  const input = { ...data, pixDonations: [{ date: '2026-11-11', amountCents: 200 }], dailyTotals: [{ date: '2026-11-11', amountBrlCents: 10000, amountUsdCents: 1000, brlPerUsd: 5 }] };
  const result = calculate(input);
  assert.equal(result.totalUsd, 30);
  assert.equal(result.confirmedUsd, 30);
  assert.equal(result.estimatedUsd, 0);
  assert.equal(calculate(input, { ...report, usdcUsd: 2 }).totalUsd, 30);
});

test('TRANS-GOAL-02: missing FX is pending, not zero or an assumed parity', () => {
  const result = calculate({ ...data, pixDonations: [{ date: '2026-11-11', amountCents: 200 }] }, null);
  assert.equal(result.pending, 1);
  assert.equal(result.provisional, true);
  assert.equal(result.scanUnavailable, true);
  assert.equal(calculate(data, { ...report, usdcUsd: null }).pending, 1);
});

test('TRANS-GOAL-06: live BRL rate converts records without historical FX, recorded FX wins', () => {
  const pix = { ...data, pixDonations: [{ date: '2026-11-11', amountCents: 200 }] };
  const withLive = calculateDonationGoals(pix, null, '2026-11', '2026-11-11', { brlPerUsd: 5 });
  assert.equal(withLive.pending, 0);
  assert.equal(withLive.totalUsd, 0.4);
  assert.equal(withLive.brlPerUsd, 5);
  const recorded = { ...data, pixDonations: [{ date: '2026-11-11', amountCents: 200, brlPerUsd: 4 }] };
  assert.equal(calculateDonationGoals(recorded, null, '2026-11', '2026-11-11', { brlPerUsd: 5 }).totalUsd, 0.5);
  const consolidated = { ...data, dailyTotals: [{ date: '2026-11-11', amountBrlCents: 1000, amountUsdCents: 100, brlPerUsd: null }] };
  const consolidatedLive = calculateDonationGoals(consolidated, null, '2026-11', '2026-11-11', { brlPerUsd: 5 });
  assert.equal(consolidatedLive.pending, 0);
  assert.equal(consolidatedLive.confirmedUsd, 3);
  for (const bad of [0, -1, NaN]) assert.equal(calculateDonationGoals(pix, null, '2026-11', '2026-11-11', { brlPerUsd: bad }).pending, 1);
});

test('TRANS-GOAL-03: actual USDC price, deduplication, period filtering and progress', () => {
  const result = calculate(data, { ...report, donations: [...report.donations, ...report.donations, { id: 'old', date: '2026-10-01', equivalentUsdc: '300' }, { id: 'future', date: '2026-11-12', equivalentUsdc: '300' }] });
  assert.equal(result.totalUsd, 99);
  assert.equal(result.remainingUsd, 66);
  assert.equal(result.percent, 60);
  assert.equal(result.daily.length, 11);
  assert.equal(result.reached, false);
});

test('TRANS-GOAL-04: zero consolidation suppresses scan; unknown BRL does not fall back to scan', () => {
  const entry = { date: '2026-11-11', amountBrlCents: 0, amountUsdCents: 0, brlPerUsd: null };
  assert.equal(calculate({ ...data, dailyTotals: [entry] }).totalUsd, 0);
  const partial = calculate({ ...data, dailyTotals: [{ ...entry, amountBrlCents: 200 }] });
  assert.equal(partial.totalUsd, 0);
  assert.equal(partial.pending, 1);
});

test('TRANS-GOAL-05: achieved goal, leap month, invalid entries and future months', () => {
  const entry = { date: '2026-11-11', amountBrlCents: 0, amountUsdCents: 20000, brlPerUsd: null };
  assert.equal(calculate({ ...data, dailyTotals: [entry] }).reached, true);
  assert.equal(calculate({ ...data, dailyTotals: [entry] }).remainingUsd, 0);
  assert.equal(calculate(data, null, '2024-02', '2024-02-29').daily.length, 29);
  assert.equal(calculate(data, null, '2026-12').daily.length, 0);
  for (const invalid of [{ ...entry, amountUsdCents: -1 }, { ...entry, date: '2026-02-30' }, { ...entry, brlPerUsd: 0 }]) assert.throws(() => calculate({ ...data, dailyTotals: [invalid] }), /INVALID_DAILY_TOTAL/);
  assert.throws(() => calculate({ ...data, dailyTotals: [entry, entry] }), /INVALID_DAILY_TOTAL/);
  assert.throws(() => calculate(data, report, '2026-13'), /INVALID_PERIOD/);
  assert.equal(calculate(data, null, '2024-02', '2024-02-29').daily.at(-1).paceUsd, 165);
});
