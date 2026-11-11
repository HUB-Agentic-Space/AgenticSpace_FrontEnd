import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { legalContent } from '../src/lib/legal-content.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('agentic_space_splash_played', '1'));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      await route.fulfill({ json: { authenticated: false, session: null, count: 0, total: 0 } });
    } else if (url.origin !== 'http://127.0.0.1:4187') {
      await route.fulfill({ status: 200, body: '', contentType: 'application/javascript' });
    } else {
      await route.continue();
    }
  });
});

for (const [locale, content] of Object.entries(legalContent)) {
  for (const [kind, path] of [['privacy', 'privacy-policy'], ['terms', 'terms-of-service']]) {
    test(`LEGAL-01/02/03/04 ${locale} ${kind}: public content, links and reload`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/${path}?lang=${locale}`);
      const article = page.getByRole('article');
      await expect(article.getByRole('heading', { level: 1 })).toHaveText(content[kind]);
      await expect(article).toHaveAttribute('lang', locale);
      await expect(article.locator('section')).toHaveCount(8);
      for (const [, text] of content[`${kind}Sections`]) {
        await expect(article.getByText(text, { exact: true })).toBeVisible();
      }
      await expect(article.getByRole('link', { name: 'admin@rapport.tec.br', exact: true })).toHaveAttribute('href', 'mailto:admin@rapport.tec.br');
      await expect(page.locator('footer').getByRole('link', { name: content.privacy, exact: true })).toHaveAttribute('href', '/privacy-policy');
      await expect(page.locator('footer').getByRole('link', { name: content.terms, exact: true })).toHaveAttribute('href', '/terms-of-service');
      await article.getByRole('link', { name: content[`${kind}Sections`][0][0], exact: true }).click();
      await expect(page).toHaveURL(/#section-1$/);
      await page.reload();
      await expect(article.getByRole('heading', { level: 1 })).toHaveText(content[kind]);
      expect(errors).toEqual([]);
    });
  }
}

for (const width of [1280, 390]) {
  for (const path of ['privacy-policy', 'terms-of-service']) {
    test(`LEGAL-04 ${path}: accessibility and layout at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${path}?lang=pt`);
      await expect(page.getByRole('article')).toHaveAttribute('lang', 'pt');
      const result = await new AxeBuilder({ page }).include('article').analyze();
      expect(result.violations.filter(v => ['critical', 'serious'].includes(v.impact))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}

test('LEGAL-04: legal content survives failed session API and cookie links remain available', async ({ page }) => {
  await page.route('**/api/v1/auth/session', route => route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Unavailable', details: {}, next_step: 'retry' } }));
  await page.goto('/privacy-policy?lang=pt');
  await expect(page.getByRole('heading', { name: legalContent.pt.privacy, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: legalContent.pt.terms, exact: true }).last()).toBeVisible();
  await page.getByRole('article').getByRole('link', { name: legalContent.pt.terms, exact: true }).click();
  await expect(page.getByRole('article').getByRole('heading', { level: 1 })).toHaveText(legalContent.pt.terms);
});
