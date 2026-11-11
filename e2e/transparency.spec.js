import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('BRLA and crypto history render with mocked RPC and safe provider warnings', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T18:00:00Z'));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem('agentic_space_splash_played', '1'));
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/transparency/donations') {
      return route.fulfill({ json: {
        updatedAt: '2026-11-11T12:00:00Z', usdcUsd: 1,
        donations: [{ id: 'brla-1', chainId: 137, network: 'Polygon', from: `0x${'1'.repeat(40)}`, date: '2026-11-11T12:00:00Z', amount: '2.0', currency: 'BRLA', equivalentUsdc: '0.36' }],
        warnings: [{ code: 'EXPLORER_PLAN_REQUIRED', chainId: 5042, message: 'O plano do explorer não permite esta consulta nesta rede.' }]
      } });
    }
    if (url.origin === 'https://api.exchangerate-api.com') return route.fulfill({ json: { result: 'success', base: 'BRL', rates: { USD: 0.2 } } });
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: { authenticated: false, session: null, count: 0, total: 0 } });
    if (request.method() === 'POST' && url.origin !== 'http://127.0.0.1:4187') {
      const payload = request.postDataJSON();
      const answer = item => ({ jsonrpc: '2.0', id: item.id, result: `0x${(2000000000000000000n).toString(16).padStart(64, '0')}` });
      return route.fulfill({ json: Array.isArray(payload) ? payload.map(answer) : answer(payload) });
    }
    if (url.origin !== 'http://127.0.0.1:4187') return route.fulfill({ status: 200, body: '', contentType: 'application/javascript' });
    return route.continue();
  });
  await page.goto('/transparencia?lang=pt');
  await expect(page.getByText('EXPLORER_PLAN_REQUIRED — Rede 5042:', { exact: false })).toBeVisible();
  const history = page.getByRole('region', { name: 'Recebimentos on-chain' });
  await expect(history.getByRole('cell', { name: 'BRLA', exact: true })).toBeVisible();
  await expect(history.getByRole('cell', { name: '0,36', exact: true })).toBeVisible();
  const balanceCard = page.getByTestId('polygon-BRLA-balance');
  await expect(balanceCard.getByRole('link')).toHaveAttribute('href', 'https://polygonscan.com/address/0xE6A537a407488807F0bbeb0038B79004f19DDDFb');
  await expect(balanceCard.getByText('2', { exact: true })).toBeVisible();
  const goals = page.getByRole('region', { name: 'Progresso da meta mensal' });
  await expect(goals.getByTestId('goal-total')).toHaveText(/0,76/);
  await expect(goals.getByText('Registros sem cotação:', { exact: false })).toContainText('Registros sem cotação: 0');
  await expect(goals.getByText('exchangerate-api', { exact: false })).toBeVisible();
  await expect(goals.getByTestId('donation-goal-chart').getByRole('application')).toBeVisible();
  await goals.getByText('Ver valores diários do gráfico').click();
  await expect(goals.getByRole('row').filter({ hasText: '2026-11-11' })).toContainText('0,76');
  const accessibility = await new AxeBuilder({ page }).include('[aria-labelledby="donation-goals-title"]').analyze();
  expect(accessibility.violations.filter(item => ['critical', 'serious'].includes(item.impact))).toEqual([]);
  await goals.getByLabel('Mês da arrecadação').fill('2026-10');
  await expect(goals.getByTestId('goal-total')).toHaveText(/0,00/);
  expect(errors).toEqual([]);
});
