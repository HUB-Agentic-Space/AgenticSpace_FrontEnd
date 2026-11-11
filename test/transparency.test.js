import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { getAddress } from 'ethers';
import { DONATION_CHAINS, DONATION_WALLET } from '../src/lib/donations.js';

test('BRLA: all configured donation addresses have valid checksums', () => {
  assert.ok(getAddress(DONATION_WALLET));
  for (const chain of DONATION_CHAINS) {
    for (const asset of chain.assets) if (asset.address) assert.ok(getAddress(asset.address));
  }
});

test('service worker: bypass external, API and POST requests; offline navigation returns a response', async () => {
  const handlers = {};
  const response = new Response('offline', { status: 503 });
  vm.runInNewContext(await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8'), {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    URL, Response,
    fetch: async () => { throw new Error('offline'); },
    caches: { match: async () => undefined },
    console
  });
  for (const [url, method] of [['https://rpc.example.test', 'POST'], ['https://example.test/api/v1/transparency/donations', 'GET'], ['https://example.test/rpc', 'POST'], ['https://rpc.example.test', 'GET']]) {
    let intercepted = false;
    handlers.fetch({ request: { url, method }, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false, `${method} ${url}`);
  }
  let result;
  handlers.fetch({ request: { url: 'https://example.test/transparencia', method: 'GET', mode: 'navigate' }, respondWith(promise) { result = promise; } });
  assert.equal((await result).status, response.status);
});
