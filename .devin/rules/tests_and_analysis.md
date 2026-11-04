---
trigger: always_on
---

# Tests and Analysis Rule

Every code change must be validated by systematic tests before it is
considered complete. A change without executed, recorded tests is
unfinished work.

## Test layers

- **Unit tests** — each new or modified function, hook, or component is
  exercised in isolation, covering normal inputs, boundary values, and
  error conditions.
- **Integration tests** — the component is exercised with its real
  collaborators (pages, API routes, providers) or the project's
  standard test doubles when the real dependency is unavailable.
- **Acceptance tests** — business requirements are exercised end to end
  through the same paths a user or agent would use in the browser
  (see the Playwright E2E section below).

## Practices required on every change

- Run the tests affected by the change plus the adjacent suites before
  marking the task done.
- Every bugfix ships with a regression test that fails without the fix.
- New public functions, components, or API routes ship with at least a
  happy-path case and an error-path case.
- Tests must be deterministic and isolated: no order dependence, no
  shared mutable state, no real external network calls.
- Never weaken, delete, or skip an existing test to make the suite pass.
- Review generated logs after each run to confirm records are correct.
- Test real scenarios, error conditions, and edge cases — not only the
  happy path.

## White-box testing (progressive)

White-box tests read the implementation, not only its contract. They are
applied progressively: each change extends coverage of the touched
module instead of trying to cover the whole project at once.

- Exercise internal branches, conditional renders, hooks' early returns,
  and exception paths — not only rendered output.
- Map every test to a `REQUIREMENTS.md` item or acceptance criterion. A
  requirement is implemented only when a test proves its behavior
  through the real code path; record the requirement ID in the test name
  or docstring.
- Progression order for the modified code: statement coverage → branch
  coverage → condition/path coverage. Track uncovered branches and
  prioritize them by risk (auth, payments, data exposure first).
- Assert internal state and effects, not only DOM output.
- Record which requirement IDs the change validated, per the logging
  and PDCL rules.

## Evidence

For each change, document: commands run, tests added or updated,
results, coverage delta for the touched module, and the requirement IDs
verified. On failure, analyze the root cause, fix it, and re-run the
full chain — never patch the symptom.

## End-to-end tests (Playwright)

Every frontend application in this monorepo must be validated with
end-to-end tests via [Playwright](https://playwright.dev) before being
considered done. E2E tests are part of the "frontend: tests (if any) +
static build" step of the `scripts/build-all.sh` pipeline (see
`builds-deploy.md`).

### E2E setup (mandatory)

- Per-module dependency (monorepo with no root `package.json`):
  `@playwright/test` in the module's `devDependencies`.
- Configuration in `frontend/playwright.config.ts`; tests under
  `frontend/e2e/` (`*.spec.ts` files).
- Minimum npm scripts in the module's `package.json`:

  ```json
  {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
  ```

- `webServer` in `playwright.config.ts` must boot the app the way it is
  served in production: `vite preview` over `dist/` or the backend
  serving `backend/public` (the SPA is distributed as an onion service —
  see `docs/tor-deployment.md`). Never test against `vite dev` in CI,
  since HMR masks build errors.
- Node.js >= 20 for the runner (Playwright requires >= 20).
- Browsers: `chromium` is the mandatory project; add `webkit` and a
  mobile (`Pixel`-like) project when mobile usage becomes relevant.
- Artifacts (`playwright-report/`, `test-results/`) belong in the
  module's `.gitignore`.

### Most important E2E tests (per-flow checklist)

Priority order — cover first the flows that move funds or on-chain
state, then UX and visual regression.

#### Entry gate and session (critical)

- With no wallet connected, the app renders **only** the `TermsPage`
  (`App.tsx` early-returns before mounting the shell).
- Accepting the terms + connecting a (mocked) wallet unlocks the
  header/nav and shows the truncated address (`0x1234…abcd`).
- Reloading the page must not leave the app in a broken state when the
  mocked wallet is already "connected" (storage state).

#### API error contract (critical — see `api.md`)

- Intercept calls with `page.route()` and assert that every error
  response renders `code`, `message`, `details` and `next_step` — never
  a stack trace, raw payload or blank screen.
- 401/403 → the app guides the correct action (re-authenticate /
  connect wallet).
- 5xx and timeout → safe message + retry option; the app must not hang
  on an eternal spinner.

#### Market (`MarketPage`)

- Lot list renders with mocked data; **empty**, **loading** and
  **error** states have explicit UI.
- Clicking a lot navigates to `LotDetailPage` with the correct `lotId`.
- Filters/sorting (if present) apply and persist during the session.

#### Create lot (`NewLotPage`) and Buy order (`NewOrderPage`)

- Client-side validation blocks submit with empty required fields,
  price <= 0, invalid duration and invalid quantity.
- Happy-path submit: correct payload sent to the mocked API, success
  feedback, redirect/reset per `next_step`.
- Backend error (e.g. 409 duplicate, 422 validation) renders the
  contract message and does **not** lose what the user typed.

#### Bids (`LotDetailPage`) — highest financial risk

- Shows current bid, minimum increment and countdown.
- A bid below the minimum (or <= current bid) is rejected with a clear
  message **before** any transaction.
- Ended auction: bid button disabled/hidden and "ended" state visible —
  even if the mocked API would accept the call.
- Bid confirmation requires explicit user action (no bid via accidental
  double-click / implicit Enter inside a field).
- State updates on incoming new bids (mocked polling/sse/websocket)
  must not reset the form.

#### Escrow (`EscrowsPage`)

- All lifecycle states (created → funded → released / disputed /
  refunded) render correctly and show actions coherent with the mocked
  wallet's role (buyer vs seller vs arbiter).
- An action unavailable for the current role never appears clickable.
- Amounts displayed formatted (ERC-20/ETH decimals), never raw wei.

#### Profile (`ProfilePage`)

- Reputation and history render with mocked data.
- Sensitive fields never show data belonging to a wallet other than the
  authenticated one.

#### Wallet and contracts

- `ethers`/`wallet.ts` always mocked via `page.addInitScript` or
  `page.route` for RPC — **never** hit a real RPC, real chain or real
  keys in tests.
- User signature rejection ("user rejected") is handled with proper UI.
- Test wallets come from environment variables (`TEST_WALLET_*` in
  `frontend/.env`), never hardcoded (see `private_key.md`).

#### Theme, accessibility and responsive

- Dark theme is the default and uses the palette tokens (`paleta.md` /
  `design_ui.md`). Assert with `getComputedStyle`.
- Accessibility scan with `@axe-core/playwright` on the main pages:
  zero `critical`/`serious` violations; input labels, visible focus,
  contrast >= 4.5:1 for text.
- Viewports: desktop 1280x720 and mobile ~390x844 — nav must not break,
  tables scroll or stack.
- Visual regression: `toHaveScreenshot()` on stable pages (baselines
  versioned per browser/OS).

#### Runtime hygiene

- Zero `console.error` and zero failed unmocked requests during
  happy-path flows (assert via `page.on('console')` /
  `page.on('pageerror')`).
- No calls to unmocked external domains (defense against data leakage
  and flakiness — and coherent with the onion/Tor threat model).

### E2E best practices (mandatory)

- **Resilient locators**: prefer `getByRole`/`getByLabel` and
  `data-testid` (the default `testIdAttribute` is `data-testid`).
  Depending on generated CSS classes, fragile partial text or long XPath
  is forbidden.
- **No `waitForTimeout`**: use Playwright auto-waiting
  (`expect(locator).toBeVisible()`, `waitForResponse`, `waitForURL`).
  A fixed timeout is a sign of a flaky test.
- **Isolation**: each `test` is independent; shared state goes through
  `storageState` or declared fixtures, never through execution order.
- **Network mocking**: `page.route()`/`route.fulfill()` for every API
  and RPC call; keep JSON fixtures in `frontend/e2e/fixtures/`.
- **Configuration**: `fullyParallel: true`, `retries: 2` only in CI,
  `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'`.
- **Secrets**: no private key, mnemonic or token in specs, fixtures or
  artifacts (trace/video may record the screen — review before attaching
  to a PR).
- **Data**: use deterministic testnet accounts and contracts; never
  mainnet.

### E2E pipeline integration and PDCL

- `scripts/build-all.sh` runs `npm run test:e2e` in the frontend step
  when `frontend/e2e/` exists; E2E failure blocks the static build (same
  criterion as contract audits).
- During development, follow `pdcl.md`: write the failing test →
  implement → re-run `npm run test:e2e` → inspect `playwright-report/`
  and traces → update `docs/REQUIREMENTS.md` if behavior changed.
- For manual debugging and UI exploration during development, use the
  `playwright` MCP server (Windsurf) or `playwright-cli` /
  `npx playwright test --debug`.

### Minimum E2E acceptance criteria

A frontend change is only complete when:

- [ ] The critical flows above are covered by specs passing on Chromium.
- [ ] API errors render the contract (`code`, `message`, `details`,
      `next_step`) — see `api.md`.
- [ ] Zero `critical`/`serious` axe violations on the touched pages.
- [ ] No `waitForTimeout`, no real network, no secrets in artifacts.
- [ ] `npm run test:e2e` green locally and in the pipeline.

## Project specifics

- Unit test runner: configure Vitest or Jest + React Testing Library
  (none configured yet); available check meanwhile: `npm run lint`.
- E2E: Playwright per the section above (`@playwright/test`, specs
  under `e2e/`). Until the setup lands, verify page/component changes
  manually in the dev server and record the scenarios exercised.
- Flag in `REQUIREMENTS.md` any change that introduces logic which
  currently cannot be tested automatically.
